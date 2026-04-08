# Deployment Guide

This guide explains how to deploy the FirstSteps application to a production environment.

## Prerequisites

1. Node.js 18+ installed
2. MongoDB database (local or cloud)
3. Domain name (optional but recommended)
4. SSL certificate (required for production)

## Backend Deployment

### 1. Environment Setup

Create a `.env` file in the `backend` directory with the following variables:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/1000steps

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# Server Configuration
PORT=5001
NODE_ENV=production

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

### 2. Install Dependencies

```bash
cd backend
npm ci --production
```

### 3. Initialize Milestones

```bash
npm run seed:milestones
```

### 4. Start the Server

```bash
npm start
```

Or use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name firststeps-backend
```

## Frontend Deployment

### 1. Environment Setup

Create a `.env.local` file in the `frontend` directory:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### 2. Install Dependencies

```bash
cd frontend
npm ci --production
```

### 3. Build the Application

```bash
npm run build
```

### 4. Start the Server

```bash
npm start
```

Or use PM2:

```bash
pm2 start node_modules/next/dist/bin/next --name firststeps-frontend -- start
```

## Database Setup

### MongoDB Atlas (Recommended for Production)

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Add your server IP to the whitelist
5. Update your `MONGODB_URI` in the backend `.env` file

### Local MongoDB

1. Install MongoDB on your server
2. Start the MongoDB service
3. Update your `MONGODB_URI` in the backend `.env` file

## SSL Configuration

For production deployment, you should use HTTPS. You can:

1. Use a reverse proxy like Nginx with Let's Encrypt
2. Use a cloud service that provides SSL (Heroku, Vercel, etc.)

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path path/to/your/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Maintenance

### Log Management

Use PM2 log management:

```bash
pm2 logs
```

### Regular Maintenance

1. Regularly backup your MongoDB database
2. Monitor server resources
3. Update dependencies regularly
4. Monitor API usage and rate limiting

### Backup Script Example

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://localhost:27017/1000steps" --out="/backups/1000steps_$DATE"
```

## Scaling Considerations

For high-traffic applications, consider:

1. Load balancing multiple backend instances
2. Using a CDN for static assets
3. Database indexing and optimization
4. Caching strategies
5. Microservices architecture for large-scale deployments

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB URI
   - Ensure MongoDB is running
   - Check firewall settings

2. **API Endpoints Not Accessible**
   - Check CORS configuration
   - Verify PORT settings
   - Check reverse proxy configuration

3. **Authentication Issues**
   - Verify JWT_SECRET is consistent
   - Check token expiration settings

### Logs

Check PM2 logs for detailed error information:

```bash
pm2 logs firststeps-backend
pm2 logs firststeps-frontend
```