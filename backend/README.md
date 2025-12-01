# PrimePOS Backend API

Django REST Framework backend for PrimePOS multi-tenant SaaS POS platform.

## Tech Stack

- **Django 4.2+**: Web framework
- **Django REST Framework**: REST API framework
- **PostgreSQL 15+**: Database
- **JWT Authentication**: djangorestframework-simplejwt
- **Django Filter**: Advanced filtering
- **CORS Headers**: Cross-origin support

## Setup

### Prerequisites

- Python 3.10+
- PostgreSQL 15+
- pip

### Installation

1. **Install dependencies**:
```bash
cd backend
pip install -r requirements.txt
```

2. **Configure environment variables**:
Create a `.env` file in the `backend` directory:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=primepos_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

3. **Create database**:
```bash
createdb primepos_db
```

4. **Run migrations**:
```bash
python manage.py migrate
```

5. **Create superuser** (optional):
```bash
python manage.py createsuperuser
```

6. **Run development server**:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/v1/`

## API Endpoints

### Authentication
- `POST /api/v1/auth/login/` - Login
- `POST /api/v1/auth/register/` - Register
- `POST /api/v1/auth/refresh/` - Refresh token
- `POST /api/v1/auth/logout/` - Logout
- `GET /api/v1/auth/me/` - Current user

### Tenants (Businesses)
- `GET /api/v1/tenants/` - List tenants
- `GET /api/v1/tenants/{id}/` - Get tenant
- `POST /api/v1/tenants/` - Create tenant (admin only)
- `PUT /api/v1/tenants/{id}/` - Update tenant (admin only)
- `GET /api/v1/tenants/current/` - Current user's tenant

### Outlets
- `GET /api/v1/outlets/` - List outlets
- `GET /api/v1/outlets/{id}/` - Get outlet
- `POST /api/v1/outlets/` - Create outlet
- `PUT /api/v1/outlets/{id}/` - Update outlet
- `GET /api/v1/outlets/{id}/tills/` - Get tills for outlet

### Products
- `GET /api/v1/products/` - List products
- `GET /api/v1/products/{id}/` - Get product
- `POST /api/v1/products/` - Create product
- `PUT /api/v1/products/{id}/` - Update product
- `DELETE /api/v1/products/{id}/` - Delete product
- `GET /api/v1/products/low_stock/` - Get low stock products

### Sales
- `GET /api/v1/sales/` - List sales
- `GET /api/v1/sales/{id}/` - Get sale
- `POST /api/v1/sales/` - Create sale
- `POST /api/v1/sales/{id}/refund/` - Process refund
- `GET /api/v1/sales/stats/` - Sales statistics

### Shifts
- `POST /api/v1/shifts/start/` - Start shift
- `POST /api/v1/shifts/{id}/close/` - Close shift
- `GET /api/v1/shifts/active/` - Get active shift
- `GET /api/v1/shifts/history/` - Shift history
- `GET /api/v1/shifts/check/` - Check if shift exists

### Inventory
- `POST /api/v1/inventory/adjust/` - Stock adjustment
- `POST /api/v1/inventory/transfer/` - Transfer stock
- `GET /api/v1/inventory/movements/` - Stock movements
- `GET /api/v1/inventory/stock-take/` - List stock takes
- `POST /api/v1/inventory/stock-take/` - Start stock take
- `POST /api/v1/inventory/stock-take/{id}/complete/` - Complete stock take

### Customers
- `GET /api/v1/customers/` - List customers
- `GET /api/v1/customers/{id}/` - Get customer
- `POST /api/v1/customers/` - Create customer
- `PUT /api/v1/customers/{id}/` - Update customer
- `POST /api/v1/customers/{id}/adjust_points/` - Adjust loyalty points

### Staff
- `GET /api/v1/staff/` - List staff
- `GET /api/v1/staff/{id}/` - Get staff
- `POST /api/v1/staff/` - Create staff
- `PUT /api/v1/staff/{id}/` - Update staff

### Reports
- `GET /api/v1/reports/sales/` - Sales report
- `GET /api/v1/reports/products/` - Products report
- `GET /api/v1/reports/customers/` - Customers report
- `GET /api/v1/reports/profit-loss/` - Profit & Loss report
- `GET /api/v1/reports/stock-movement/` - Stock movement report

### Admin (SaaS Admin Only)
- `GET /api/v1/admin/tenants/` - List all tenants
- `POST /api/v1/admin/tenants/{id}/suspend/` - Suspend tenant
- `POST /api/v1/admin/tenants/{id}/activate/` - Activate tenant
- `GET /api/v1/admin/analytics/` - Platform analytics

## Authentication

All endpoints (except login/register) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Tokens expire after 1 hour. Use the refresh endpoint to get a new access token.

## Multi-Tenant Architecture

The system uses tenant-based data isolation:
- All models have a `tenant` ForeignKey
- Middleware automatically filters data by tenant
- SaaS admins can access all tenants
- Regular users only see their tenant's data

## Database Models

### Core Models
- `Tenant` - Business/tenant
- `Outlet` - Business locations
- `User` - Extended Django user
- `Product` - Products
- `Category` - Product categories
- `Sale` - Transactions
- `SaleItem` - Transaction line items
- `Customer` - CRM data
- `Staff` - Staff members
- `Role` - Permission roles
- `Shift` - Day shift management
- `Till` - Cash register tills
- `StockMovement` - Inventory tracking
- `StockTake` - Stock counting sessions

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Django Admin
Access at `http://localhost:8000/admin/` (requires superuser)

## Production Deployment

1. Set `DEBUG=False` in production settings
2. Use environment variables for all secrets
3. Configure proper CORS origins
4. Use a production database (PostgreSQL)
5. Set up static file serving
6. Configure SSL/HTTPS
7. Use a production WSGI server (gunicorn, uwsgi)

## API Documentation

API documentation can be generated using Django REST Framework's built-in browsable API or Swagger/OpenAPI tools.

Access the browsable API at any endpoint (e.g., `http://localhost:8000/api/v1/products/`)
