FROM python:3.12-alpine
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY pyproject.toml uv.lock* ./

RUN apk add --no-cache \
    gcc \
    g++ \
    musl-dev \
    python3-dev \
    krb5-dev \
    && rm -rf /var/cache/apk/*

RUN /bin/uv sync --frozen --no-dev
COPY . ./
EXPOSE 8000
CMD ["uv", "run", "app.py"]