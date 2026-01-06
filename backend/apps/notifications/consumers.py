"""
WebSocket consumer for real-time notifications
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Notification

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.user = await self.get_user(self.user_id)
        
        if not self.user:
            await self.close()
            return
        
        # Create a group name for this user
        self.group_name = f'notifications_{self.user_id}'
        
        # Join the group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave the group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle messages received from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': timezone.now().isoformat()
                }))
        except json.JSONDecodeError:
            pass
    
    async def notification_message(self, event):
        """Send notification to WebSocket"""
        notification_data = event['notification']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': notification_data
        }))
    
    async def notification_count(self, event):
        """Send notification count update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification_count',
            'unread_count': event['unread_count']
        }))
    
    async def sale_update(self, event):
        """Send sale update to WebSocket for real-time sales list updates"""
        sale_data = event.get('sale')
        await self.send(text_data=json.dumps({
            'type': 'sale_update',
            'sale': sale_data,
            'action': event.get('action', 'created')  # 'created', 'updated', 'refunded'
        }))
    
    @database_sync_to_async
    def get_user(self, user_id):
        """Get user by ID"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

