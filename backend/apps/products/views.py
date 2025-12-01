from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer
from apps.tenants.permissions import TenantFilterMixin
from django.db import transaction
import logging
import pandas as pd
import io
import csv

logger = logging.getLogger(__name__)


class CategoryViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Category ViewSet"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def perform_create(self, serializer):
        # Tenant is read-only, so always set it from request context
        if hasattr(self.request, 'tenant') and self.request.tenant:
            serializer.save(tenant=self.request.tenant)
        elif self.request.user.tenant:
            serializer.save(tenant=self.request.user.tenant)
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Tenant is required. Please ensure you are authenticated and have a tenant assigned.")


class ProductViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Product ViewSet"""
    queryset = Product.objects.select_related('category', 'tenant')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant', 'category', 'is_active']
    search_fields = ['name', 'sku', 'barcode', 'description']
    ordering_fields = ['name', 'price', 'stock', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Override to add logging for tenant filtering"""
        queryset = super().get_queryset()
        user = self.request.user
        is_saas_admin = getattr(user, 'is_saas_admin', False)
        user_tenant = getattr(user, 'tenant', None)
        
        logger.info(f"ProductViewSet.get_queryset - User: {user.email}, is_saas_admin: {is_saas_admin}, user_tenant: {user_tenant}")
        
        if is_saas_admin:
            logger.warning("SaaS admin accessing products - returning ALL products (no tenant filter)")
        elif user_tenant:
            logger.info(f"Filtering products by tenant: {user_tenant.id} ({user_tenant.name})")
        else:
            logger.warning("No tenant found for user - returning empty queryset")
        
        return queryset
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Override create to log validation errors"""
        logger.info(f"Creating product with data: {request.data}")
        logger.info(f"User: {request.user}, Tenant: {getattr(request.user, 'tenant', None)}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            # Return detailed error message
            error_detail = serializer.errors
            if isinstance(error_detail, dict):
                # Format errors nicely
                error_messages = []
                for field, errors in error_detail.items():
                    if isinstance(errors, list):
                        error_messages.extend([f"{field}: {error}" for error in errors])
                    else:
                        error_messages.append(f"{field}: {errors}")
                error_detail = {'detail': '; '.join(error_messages), 'errors': serializer.errors}
            return Response(error_detail, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        # Always set tenant from request context (frontend doesn't send it)
        if hasattr(self.request, 'tenant') and self.request.tenant:
            serializer.save(tenant=self.request.tenant)
        elif self.request.user.tenant:
            serializer.save(tenant=self.request.user.tenant)
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Tenant is required. Please ensure you are authenticated and have a tenant assigned.")
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock"""
        queryset = self.filter_queryset(self.get_queryset())
        low_stock_products = [p for p in queryset if p.is_low_stock]
        page = self.paginate_queryset(low_stock_products)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(low_stock_products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='generate-sku')
    def generate_sku_preview(self, request):
        """Generate a preview SKU for the current tenant"""
        tenant = getattr(request, 'tenant', None) or (request.user.tenant if hasattr(request, 'user') and request.user.is_authenticated else None)
        if not tenant:
            return Response({'error': 'Unable to determine tenant.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Use the serializer's generate_sku method
        serializer = self.get_serializer()
        preview_sku = serializer.generate_sku(tenant)
        
        return Response({'sku': preview_sku})
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete a product
        Ensures tenant filtering and proper logging
        """
        instance = self.get_object()
        
        # Get tenant for logging
        tenant = getattr(request, 'tenant', None) or (request.user.tenant if hasattr(request, 'user') and request.user.is_authenticated else None)
        
        # Verify the product belongs to the user's tenant (unless SaaS admin)
        user = request.user
        is_saas_admin = getattr(user, 'is_saas_admin', False)
        
        if not is_saas_admin and tenant:
            if instance.tenant != tenant:
                logger.warning(f"User {user.email} attempted to delete product {instance.id} from different tenant")
                return Response(
                    {'error': 'You do not have permission to delete this product.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        product_name = instance.name
        product_id = instance.id
        
        logger.info(f"Deleting product: {product_name} (ID: {product_id}) by user: {user.email}")
        
        try:
            self.perform_destroy(instance)
            logger.info(f"Product {product_name} (ID: {product_id}) deleted successfully")
            return Response(
                {'message': f'Product "{product_name}" has been deleted successfully.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error deleting product {product_id}: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to delete product: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """
        Bulk delete multiple products
        Expects a list of product IDs in the request body
        """
        tenant = getattr(request, 'tenant', None) or (request.user.tenant if hasattr(request, 'user') and request.user.is_authenticated else None)
        if not tenant:
            return Response(
                {'error': 'Unable to determine tenant. Please ensure you are authenticated and have a tenant assigned.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        product_ids = request.data.get('product_ids', [])
        
        if not product_ids or not isinstance(product_ids, list):
            return Response(
                {'error': 'Please provide a list of product IDs to delete.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(product_ids) == 0:
            return Response(
                {'error': 'No product IDs provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        is_saas_admin = getattr(user, 'is_saas_admin', False)
        
        # Get products that belong to the tenant
        queryset = Product.objects.filter(id__in=product_ids)
        
        if not is_saas_admin:
            queryset = queryset.filter(tenant=tenant)
        
        products_to_delete = list(queryset)
        products_not_found = set(product_ids) - {p.id for p in products_to_delete}
        
        if not products_to_delete:
            return Response(
                {'error': 'No products found to delete. They may not exist or belong to a different tenant.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Delete products
        deleted_count = 0
        deleted_names = []
        
        try:
            with transaction.atomic():
                for product in products_to_delete:
                    product_name = product.name
                    product.delete()
                    deleted_count += 1
                    deleted_names.append(product_name)
                    logger.info(f"Bulk deleted product: {product_name} (ID: {product.id}) by user: {user.email}")
        except Exception as e:
            logger.error(f"Error during bulk delete: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to delete products: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        response_data = {
            'success': True,
            'deleted_count': deleted_count,
            'deleted_products': deleted_names,
        }
        
        if products_not_found:
            response_data['not_found'] = list(products_not_found)
            response_data['warning'] = f'{len(products_not_found)} product(s) were not found or do not belong to your tenant.'
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    def resolve_categories(self, category_names, tenant):
        """
        Resolve category names to category IDs
        Creates categories if they don't exist
        
        Returns: dict {category_name: category_id}
        """
        category_map = {}
        
        for category_name in category_names:
            if not category_name or (isinstance(category_name, str) and category_name.strip() == ""):
                continue
            
            # Normalize for lookup (case-insensitive)
            normalized = str(category_name).strip()
            
            # Check if exists (case-insensitive match)
            category = Category.objects.filter(
                tenant=tenant,
                name__iexact=normalized
            ).first()
            
            if category:
                # Use existing category
                category_map[category_name] = category.id
            else:
                # Create new category
                new_category = Category.objects.create(
                    tenant=tenant,
                    name=normalized,  # Use original case
                    description=""
                )
                category_map[category_name] = new_category.id
                logger.info(f"Auto-created category: {normalized} for tenant {tenant.name}")
        
        return category_map
    
    @action(detail=False, methods=['post'], url_path='bulk-import')
    def bulk_import(self, request):
        """
        Bulk import products from Excel/CSV file
        Auto-creates categories if they don't exist
        """
        logger.info(f"Bulk import request received. User: {request.user.email if hasattr(request, 'user') else 'Unknown'}")
        logger.info(f"Request FILES keys: {list(request.FILES.keys()) if request.FILES else 'No FILES'}")
        logger.info(f"Request content type: {request.content_type}")
        logger.info(f"Request method: {request.method}")
        
        # Get tenant
        tenant = getattr(request, 'tenant', None) or (request.user.tenant if hasattr(request, 'user') and request.user.is_authenticated else None)
        if not tenant:
            logger.error("Bulk import failed: No tenant found")
            return Response(
                {'error': 'Unable to determine tenant. Please ensure you are authenticated and have a tenant assigned.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Bulk import for tenant: {tenant.name} (ID: {tenant.id})")
        
        # Check if file was uploaded
        if 'file' not in request.FILES:
            logger.error("Bulk import failed: No file in request.FILES")
            logger.info(f"Available FILES keys: {list(request.FILES.keys())}")
            return Response(
                {'error': 'No file uploaded. Please select a file to import.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        file_name = uploaded_file.name.lower()
        logger.info(f"File received: {uploaded_file.name}, size: {uploaded_file.size} bytes")
        
        # Validate file type
        if not (file_name.endswith('.xlsx') or file_name.endswith('.xls') or file_name.endswith('.csv')):
            return Response(
                {'error': 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = {
            'success': False,
            'total_rows': 0,
            'imported': 0,
            'failed': 0,
            'categories_created': 0,
            'categories_existing': 0,
            'errors': [],
            'warnings': []
        }
        
        try:
            # Read file
            if file_name.endswith('.csv'):
                # Read CSV
                file_content = uploaded_file.read().decode('utf-8')
                df = pd.read_csv(io.StringIO(file_content))
            else:
                # Read Excel
                df = pd.read_excel(uploaded_file, engine='openpyxl')
            
            # Normalize column names (case-insensitive, strip whitespace)
            df.columns = df.columns.str.strip()
            column_mapping = {col.lower(): col for col in df.columns}
            
            # Check required columns
            if 'name' not in column_mapping:
                return Response(
                    {'error': 'Required column "Name" not found in file.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if 'price' not in column_mapping:
                return Response(
                    {'error': 'Required column "Price" not found in file.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Extract unique category names
            category_column = column_mapping.get('category', None)
            category_names = set()
            if category_column:
                category_names = set(df[category_column].dropna().astype(str).str.strip())
                category_names = {c for c in category_names if c and c.lower() != 'nan'}
            
            # Resolve/create categories
            category_map = {}
            if category_names:
                category_map = self.resolve_categories(category_names, tenant)
                # Count created vs existing
                for cat_name in category_names:
                    normalized = str(cat_name).strip()
                    existing = Category.objects.filter(tenant=tenant, name__iexact=normalized).exists()
                    if existing:
                        results['categories_existing'] += 1
                    else:
                        results['categories_created'] += 1
            
            # Process each row
            results['total_rows'] = len(df)
            
            for idx, row in df.iterrows():
                row_num = idx + 2  # Excel row number (1-based, +1 for header)
                
                try:
                    # Extract data
                    name_col = column_mapping['name']
                    price_col = column_mapping['price']
                    
                    name = str(row[name_col]).strip() if pd.notna(row[name_col]) else ""
                    price_str = str(row[price_col]).strip() if pd.notna(row[price_col]) else "0"
                    
                    # Validate required fields
                    if not name:
                        results['errors'].append({
                            'row': row_num,
                            'product_name': 'Unknown',
                            'error': 'Name is required'
                        })
                        results['failed'] += 1
                        continue
                    
                    try:
                        price = float(price_str)
                        if price < 0.01:
                            results['errors'].append({
                                'row': row_num,
                                'product_name': name,
                                'error': 'Price must be greater than 0.01'
                            })
                            results['failed'] += 1
                            continue
                    except (ValueError, TypeError):
                        results['errors'].append({
                            'row': row_num,
                            'product_name': name,
                            'error': f'Invalid price value: {price_str}'
                        })
                        results['failed'] += 1
                        continue
                    
                    # Get optional fields
                    stock = 0
                    if 'stock' in column_mapping:
                        stock_val = row[column_mapping['stock']]
                        if pd.notna(stock_val):
                            try:
                                stock = int(float(stock_val))
                            except (ValueError, TypeError):
                                stock = 0
                    
                    unit = 'pcs'
                    if 'unit' in column_mapping:
                        unit_val = row[column_mapping['unit']]
                        if pd.notna(unit_val):
                            unit = str(unit_val).strip() or 'pcs'
                    
                    sku = None
                    if 'sku' in column_mapping:
                        sku_val = row[column_mapping['sku']]
                        if pd.notna(sku_val):
                            sku = str(sku_val).strip()
                            if not sku:
                                sku = None
                    
                    category_id = None
                    if category_column and category_column in row:
                        category_name = row[category_column]
                        if pd.notna(category_name):
                            cat_name_str = str(category_name).strip()
                            if cat_name_str and cat_name_str.lower() != 'nan':
                                category_id = category_map.get(cat_name_str)
                                if not category_id:
                                    results['warnings'].append({
                                        'row': row_num,
                                        'product_name': name,
                                        'warning': f'Category "{cat_name_str}" not found, product created without category'
                                    })
                    
                    barcode = None
                    if 'barcode' in column_mapping:
                        barcode_val = row[column_mapping['barcode']]
                        if pd.notna(barcode_val):
                            barcode = str(barcode_val).strip() or None
                    
                    cost = None
                    if 'cost' in column_mapping:
                        cost_val = row[column_mapping['cost']]
                        if pd.notna(cost_val):
                            try:
                                cost = float(cost_val)
                                if cost < 0:
                                    cost = 0
                            except (ValueError, TypeError):
                                cost = None
                    
                    description = ""
                    if 'description' in column_mapping:
                        desc_val = row[column_mapping['description']]
                        if pd.notna(desc_val):
                            description = str(desc_val).strip()
                    
                    low_stock_threshold = 0
                    if 'low stock threshold' in column_mapping or 'low_stock_threshold' in column_mapping:
                        threshold_col = column_mapping.get('low stock threshold') or column_mapping.get('low_stock_threshold')
                        if threshold_col:
                            threshold_val = row[threshold_col]
                            if pd.notna(threshold_val):
                                try:
                                    low_stock_threshold = int(float(threshold_val))
                                except (ValueError, TypeError):
                                    low_stock_threshold = 0
                    
                    is_active = True
                    if 'is active' in column_mapping or 'is_active' in column_mapping:
                        active_col = column_mapping.get('is active') or column_mapping.get('is_active')
                        if active_col:
                            active_val = row[active_col]
                            if pd.notna(active_val):
                                active_str = str(active_val).strip().lower()
                                is_active = active_str in ('yes', 'true', '1', 'y')
                    
                    # Prepare product data
                    product_data = {
                        'name': name,
                        'price': str(price),
                        'stock': stock,
                        'unit': unit,
                        'description': description,
                        'low_stock_threshold': low_stock_threshold,
                        'is_active': is_active,
                    }
                    
                    if sku:
                        product_data['sku'] = sku
                    
                    if category_id:
                        product_data['category_id'] = category_id
                    
                    if barcode:
                        product_data['barcode'] = barcode
                    
                    if cost is not None:
                        product_data['cost'] = str(cost)
                    
                    # Create product using serializer
                    serializer = ProductSerializer(
                        data=product_data,
                        context={'request': request}
                    )
                    
                    if serializer.is_valid():
                        with transaction.atomic():
                            serializer.save(tenant=tenant)
                        results['imported'] += 1
                    else:
                        error_msg = '; '.join([f"{k}: {', '.join(v) if isinstance(v, list) else v}" for k, v in serializer.errors.items()])
                        results['errors'].append({
                            'row': row_num,
                            'product_name': name,
                            'error': error_msg
                        })
                        results['failed'] += 1
                
                except Exception as e:
                    logger.error(f"Error processing row {row_num}: {str(e)}", exc_info=True)
                    results['errors'].append({
                        'row': row_num,
                        'product_name': str(row.get(column_mapping.get('name', 'Unknown'), 'Unknown')),
                        'error': str(e)
                    })
                    results['failed'] += 1
            
            results['success'] = True
            
            return Response(results, status=status.HTTP_200_OK)
        
        except pd.errors.EmptyDataError:
            return Response(
                {'error': 'The uploaded file is empty.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Bulk import error: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Error processing file: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

