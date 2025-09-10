# Use Node.js 18 LTS for building
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - use Nginx to serve static files
FROM nginx:alpine

# Copy built app to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Railway will assign)
EXPOSE $PORT

# Start nginx with dynamic port
CMD sed -i "s/80/$PORT/g" /etc/nginx/conf.d/default.conf && nginx -g "daemon off;"
