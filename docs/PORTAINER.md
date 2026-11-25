# Guía de Despliegue con Docker y Portainer

Esta guía explica cómo desplegar el **CRM de WhatsApp con IA** en un servidor VPS usando **Docker, PostgreSQL y Portainer** como panel de control visual.

---

## 1. Instalar Docker y Portainer en tu VPS (Ubuntu)

Conéctate a tu VPS por SSH y ejecuta estos comandos:

### Paso 1: Instalar Docker y Docker Compose
```bash
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker
```

### Paso 2: Levantar Portainer
```bash
docker volume create portainer_data

docker run -d -p 8000:8000 -p 9443:9443 --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/var/data \
  portainer/portainer-ce:latest
```

Listo. Abre en tu navegador `https://TU_IP:9443` y crea la contraseña de administrador de Portainer.

---

## 2. Desplegar el CRM desde Portainer (Stacks)

1. En el panel de Portainer, ve a **Stacks** → **Add stack**.
2. Ponle un nombre al stack (ejemplo: `crm-cliente1`).
3. En el **Web editor**, pega el contenido de [docker-compose.yml](docker-compose.yml):

```yaml
services:
  # Base de datos PostgreSQL dedicada
  postgres:
    image: postgres:17-alpine
    container_name: crm-cliente1-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: crm
      POSTGRES_PASSWORD: crm_password_segura_123
      POSTGRES_DB: crm_db
    volumes:
      - postgres_cliente1_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crm -d crm_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - crm-cliente1-net

  # Aplicación CRM WhatsApp
  crm:
    image: crm-whatsapp-ia:latest # o build si clonas el repo
    container_name: crm-cliente1-app
    restart: unless-stopped
    ports:
      - "8001:8000"  # Puerto local en el VPS
    environment:
      - NODE_ENV=production
      - PUERTO=8000
      - DATABASE_URL=postgresql://crm:crm_password_segura_123@postgres:5432/crm_db
      - CRM_DOMINIO=crm.cliente1.com
      - CRM_URL_PUBLICA=https://crm.cliente1.com
      - ANTHROPIC_API_KEY=sk-ant-...
      - WHATSAPP_TOKEN=EAAG...
      - META_APP_SECRET=abcdef...
      - WEBHOOK_VERIFY_TOKEN=token_seguro_webhook
      - WHATSAPP_PHONE_NUMBER_ID=123456789
      - WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
    volumes:
      - crm_cliente1_agente:/app/agente.md
      - crm_cliente1_copias:/app/copias
      - crm_cliente1_logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - crm-cliente1-net

volumes:
  postgres_cliente1_data:
  crm_cliente1_agente:
  crm_cliente1_copias:
  crm_cliente1_logs:

networks:
  crm-cliente1-net:
```

4. Haz clic en **Deploy the stack**.

> **Nota si usas Supabase o PostgreSQL externo:**
> Si prefieres que la base de datos esté en Supabase o Neon, simplemente borra el servicio `postgres` del stack y en `DATABASE_URL` pon la connection string de Supabase:
> `DATABASE_URL=postgresql://postgres.xxx:pass@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

---

## 3. ¿Cómo agregar un segundo cliente? (Cliente 2)

Para sumar a otro cliente en el mismo servidor:
1. En Portainer ve a **Stacks** → **Add stack**.
2. Nombre: `crm-cliente2`.
3. Pega el mismo YAML cambiando:
   * Los nombres de contenedores: `crm-cliente2-app`, `crm-cliente2-db`.
   * El puerto expuesto: `ports: - "8002:8000"` (puerto diferente).
   * La clave de WhatsApp y credenciales del cliente 2.
   * `CRM_DOMINIO=crm.cliente2.com`.
4. Clic en **Deploy**. Cada cliente tiene su contenedor, su base de datos y sus datos 100% aislados.

---

## 4. Reverse Proxy con SSL Automático (Caddy o Nginx Proxy Manager)

Para que cada cliente tenga su dominio con HTTPS (`https://crm.cliente1.com` y `https://crm.cliente2.com`), lo más fácil es usar **Caddy**:

Crea un archivo `/etc/caddy/Caddyfile`:
```caddy
crm.cliente1.com {
    reverse_proxy localhost:8001
}

crm.cliente2.com {
    reverse_proxy localhost:8002
}
```
Y ejecuta `sudo systemctl reload caddy`. Caddy se encarga de emitir y renovar automáticamente los certificados SSL gratuitos de Let's Encrypt.
