# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if any needed for OR-Tools or Scientific libs)
# build-essential is often needed for compiling some python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port (Render sets PORT env var, but we document 8000)
EXPOSE 8000

# Command to run the application
# Use host 0.0.0.0 to allow external access
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
