# Guía de Puesta en Marcha: CRM de WhatsApp con IA

Esta guía contiene los 3 pasos para dejar tu asistente funcionando:
1. **Paso 1:** Obtener tu número de WhatsApp para el bot.
2. **Paso 2:** Crear y recargar tu cuenta de IA (elige tu proveedor favorito: **Anthropic**, **OpenAI** o **Google**).
3. **Paso 3:** Pegar las claves en tu panel de CRM.

---

## Paso 1: El número de WhatsApp

El asistente de IA responde mediante la **API Oficial de Meta**. Para eso necesitas:

1. **Un número de teléfono exclusivo para el bot:**
   * Puede ser un chip prepago nuevo o una línea fija.
   * **Requisito fundamental:** No debe tener una cuenta activa de WhatsApp en la app del celular (si ya la tiene, hay que ir a *WhatsApp → Ajustes → Cuenta → Eliminar cuenta* para poder vincularlo a la API en la nube).
2. **Tu Business Manager de Meta:**
   > 💡 **Consejo:** La forma más rápida y sin enredos técnicos es agregar a la agencia como administrador de tu Meta Business Suite (`business.facebook.com → Configuración → Personas`). Así nosotros configuramos la conexión de WhatsApp en 5 minutos por ti.

---

## Paso 2: Elige tu proveedor de IA, obtén tu API Key y activa la recarga

Elige **uno** de los tres proveedores siguientes:

---

### Opción A: Anthropic Claude *(Recomendado por su precisión y tono humano)*

#### 1. Cómo recargar saldo y activar la recarga automática
1. Entra en [console.anthropic.com](https://console.anthropic.com/) y crea tu cuenta con tu email de empresa.
2. Ve a **Settings → Plans & Billing** (o entra directo a [este enlace](https://console.anthropic.com/settings/billing)).
3. Haz clic en **"Add Credits"** y carga un saldo inicial de **$10 USD** con tu tarjeta.
4. En esa misma pantalla, activa la opción **"Auto-reload" (Recarga automática)**:
   * *When credit balance falls below:* **$5 USD**
   * *Add credit balance of:* **$10 USD**

#### 2. Dónde generar tu API Key
1. En el menú izquierdo, ve a **API Keys** ([este enlace](https://console.anthropic.com/settings/keys)).
2. Haz clic en **"Create Key"**.
3. Ponle de nombre `CRM WhatsApp` y haz clic en **"Create Key"**.
4. Copia el texto que empieza con `sk-ant-...`.

---

### Opción B: OpenAI *(GPT-4o Mini: excelente relación calidad / precio)*

#### 1. Cómo recargar saldo y activar la recarga automática
1. Entra en [platform.openai.com](https://platform.openai.com/) e inicia sesión o crea tu cuenta.
2. Ve a **Settings (arriba a la derecha) → Billing** ([este enlace](https://platform.openai.com/settings/organization/billing/overview)).
3. Haz clic en **"Add to credit balance"** y carga **$10 USD**.
4. Justo debajo, haz clic en **"Auto-recharge"** y configúralo:
   * *When balance drops below:* **$5 USD**
   * *Bring balance back up to / Add:* **$10 USD**
   * Haz clic en **Save settings**.

#### 2. Dónde generar tu API Key
1. En el menú de la izquierda, entra a **API Keys** ([este enlace](https://platform.openai.com/api-keys)).
2. Haz clic en **"Create new secret key"**.
3. En *Name* escribe `CRM WhatsApp`, deja los permisos en *All* y haz clic en **"Create secret key"**.
4. Copia la clave que empieza por `sk-proj-...`.

---

### Opción C: Google Gemini *(Gemini 2.0 Flash: ultrarrápido y el más económico)*

Google funciona a mes vencido según lo consumido (no requiere recarga prepaga).

#### 1. Cómo vincular tu tarjeta de crédito
1. Entra en [Google AI Studio](https://aistudio.google.com/) con tu cuenta de Google.
2. Para usarlo en producción sin límites por minuto, habilita el plan *Pay-as-you-go*:
   * Ve a [console.cloud.google.com/billing](https://console.cloud.google.com/billing).
   * Agrega tu tarjeta de crédito en tu cuenta de facturación de Google Cloud.

#### 2. Dónde generar tu API Key
1. Vuelve a [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Haz clic en **"Create API key"**.
3. Elige el proyecto de Google Cloud donde vinculaste tu tarjeta y confirma.
4. Copia la clave que empieza por `AIzaSy...`.

---

## Paso 3: Dónde se pega la API Key en el CRM

1. Abre tu panel de control del CRM: `https://crm.tuempresa.com/entrar`.
2. Ingresa con tu contraseña y ve a **Ajustes** → **Conexiones**.
3. En **"Tu asistente"**, pega tu API Key (o envíala a tu gestor si corre como variable de entorno en el servidor).
4. El sistema verificará la clave y mostrará **"✓ Conectado"**.
