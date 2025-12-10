# Como Configurar o N8N para Retornar os Dados Corretos

## Problema Atual

Seu N8N está retornando apenas:
```json
{"resposta":"Estória recebida"}
```

Mas o sistema precisa receber os dados gerados (história e/ou arquivo PDF).

---

## Solução: Configure o N8N para Retornar os Dados

Você tem **2 opções**:

### Opção 1: Resposta Síncrona (Mais Simples)

O N8N processa tudo e retorna o resultado imediatamente na mesma requisição.

**Como configurar:**

1. No seu workflow do N8N, adicione um nó **"Respond to Webhook"** no final
2. Configure para retornar JSON com esta estrutura:

```json
{
  "fileUrl": "{{ $node['Nome_do_No_Anterior'].json.linkDoArquivo }}",
  "content": "{{ $node['Nome_do_No_Anterior'].json.historiaGerada }}"
}
```

**Exemplo de resposta esperada:**
```json
{
  "fileUrl": "https://storage.exemplo.com/arquivo.pdf",
  "content": "Era uma vez a Professora Heley de Abreu que salvou diversas crianças..."
}
```

### Opção 2: Callback Assíncrono (Para processamentos longos)

Se o processamento demora muito (gerar PDFs, usar IA, etc), faça assim:

**Passo 1:** No início do workflow, retorne uma confirmação imediata:
```json
{
  "status": "processing",
  "message": "Processamento iniciado"
}
```

**Passo 2:** No final do workflow (quando o processamento terminar), adicione um nó **HTTP Request** que faça POST para:

**URL:**
```
https://seu-projeto.supabase.co/functions/v1/update-hero-status
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "heroId": "{{ $node['Webhook'].json.body.heroId }}",
  "fileUrl": "{{ $node['GeradorPDF'].json.linkDoArquivo }}",
  "content": "{{ $node['GeradorHistoria'].json.texto }}"
}
```

---

## Campos Aceitos pelo Sistema

### Para URL do arquivo (qualquer um destes):
- `fileUrl` ✅ (recomendado)
- `file_url`
- `url`
- `link`
- `downloadUrl`
- `download_url`

### Para conteúdo/história (qualquer um destes):
- `content` ✅ (recomendado)
- `story`
- `text`
- `generatedContent`
- `generated_content`
- `output`
- `result`

### Exemplos válidos:

Mínimo (só história):
```json
{
  "content": "História completa aqui..."
}
```

Mínimo (só arquivo):
```json
{
  "fileUrl": "https://exemplo.com/arquivo.pdf"
}
```

Completo:
```json
{
  "fileUrl": "https://exemplo.com/arquivo.pdf",
  "content": "História completa aqui...",
  "status": "completed"
}
```

---

## Como Testar

1. **Abra o Console do navegador** (F12)
2. **Registre um novo herói**
3. **Verifique os logs:**

Se aparecer:
```
❌ PROBLEMA: N8N não retornou fileUrl nem content!
```

Significa que o N8N não está retornando os campos corretos.

Se aparecer:
```
✅ URL do arquivo: https://...
✅ Conteúdo: Era uma vez...
```

Está funcionando corretamente!

---

## Exemplo de Workflow N8N (Opção 1 - Síncrono)

```
[Webhook]
    ↓
[Processar Dados]
    ↓
[Gerar História com IA]
    ↓
[Gerar PDF]
    ↓
[Respond to Webhook] ← IMPORTANTE!
    └─ Retornar: { "fileUrl": "...", "content": "..." }
```

## Exemplo de Workflow N8N (Opção 2 - Assíncrono)

```
[Webhook]
    ↓
[Respond Immediately] ← Retorna: {"status": "processing"}
    ↓
[Processar Dados]
    ↓
[Gerar História com IA]
    ↓
[Gerar PDF]
    ↓
[HTTP Request] ← POST para update-hero-status
    └─ Body: { "heroId": "...", "fileUrl": "...", "content": "..." }
```

---

## Precisa de Ajuda?

1. Tire um print do seu workflow do N8N
2. Mostre o JSON que o N8N está retornando
3. Compartilhe os logs do console do navegador
