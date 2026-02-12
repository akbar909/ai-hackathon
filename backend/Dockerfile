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

# Create a non-root user (required by Hugging Face Spaces)
RUN useradd -m -u 1000 user

# Copy the rest of the application with correct permissions
COPY --chown=user . .

# Ensure permissions for all directories (especially for writing models/data)
RUN mkdir -p /app/ml /app/data && chown -R user:user /app

# Switch to the non-root user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Command to run the application on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
