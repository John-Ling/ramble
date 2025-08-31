FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY pyproject.toml uv.lock ./

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3-dev \
    libkrb5-dev \
    && rm -rf /var/lib/apt/lists/*

RUN /bin/uv sync --frozen --no-dev
COPY *.py ./
EXPOSE 8000
CMD ["uv", "run", "app.py"]