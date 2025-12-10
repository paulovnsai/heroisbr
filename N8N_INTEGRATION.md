# Integração com N8N

## URL do Webhook Principal
```
https://n8n01.nevico.com.br/webhook/f2919f1d-acef-4741-ab00-b537cfcbdcc7
```

## URL da Edge Function (Callback)
```
https://{seu-projeto}.supabase.co/functions/v1/update-hero-status
```

## Fluxo de Integração

### 1. Aplicação envia dados para o N8N

**Método:** POST
**Headers:** Content-Type: application/json

**Payload:**
```json
{
  "heroId": "uuid-do-heroi",
  "name": "Nome do Herói",
  "ideia": "Descrição do ato heroico",
  "observacao": "Observações adicionais",
  "local": "Cidade - Estado",
  "ano": "2017",
  "status": "Esquecido",
  "artstyle": "Historical semi-realistic digital painting",
  "storylength": "20"
}
```

### 2. N8N processa e retorna dados

O N8N pode retornar os dados de **DUAS FORMAS**:

#### Opção 1: Resposta Síncrona (Imediata)

O N8N responde imediatamente com o resultado:

```json
{
  "fileUrl": "https://exemplo.com/arquivo.pdf",
  "content": "História gerada pelo N8N aqui...",
  "status": "completed"
}
```

#### Opção 2: Callback Assíncrono (Recomendado para processamentos longos)

O N8N responde `200 OK` imediatamente e depois faz um POST para a Edge Function:

**URL:** `https://{seu-projeto}.supabase.co/functions/v1/update-hero-status`
**Método:** POST
**Headers:** Content-Type: application/json

**Payload do Callback:**
```json
{
  "heroId": "uuid-do-heroi-que-foi-enviado",
  "fileUrl": "https://exemplo.com/arquivo.pdf",
  "content": "História completa gerada pelo N8N...",
  "status": "completed"
}
```

## Campos Aceitos

### Para file_url (URL do arquivo):
O sistema aceita qualquer um destes campos:
- `fileUrl`
- `file_url`
- `url`
- `fileurl`
- `file_Url`
- `downloadUrl`
- `download_url`
- `link`

### Para conteúdo gerado (texto):
O sistema aceita qualquer um destes campos:
- `content`
- `story`
- `text`
- `generatedContent`
- `generated_content`
- `output`
- `result`

### Para status:
- `status`: pode ser `"processing"`, `"completed"` ou `"error"`

## Exemplo Completo de Resposta do N8N

### Resposta Síncrona Mínima:
```json
{
  "content": "Era uma vez um herói chamado João..."
}
```

### Resposta Síncrona Completa:
```json
{
  "fileUrl": "https://storage.example.com/heroes/joao_silva_historia.pdf",
  "content": "Era uma vez um herói chamado João Silva que salvou 50 crianças de um incêndio...",
  "status": "completed"
}
```

### Callback Assíncrono Completo:
```json
{
  "heroId": "550e8400-e29b-41d4-a716-446655440000",
  "fileUrl": "https://storage.example.com/heroes/joao_silva_historia.pdf",
  "content": "Era uma vez um herói chamado João Silva que salvou 50 crianças de um incêndio...",
  "status": "completed"
}
```

## Notas Importantes

1. **O campo `heroId` é obrigatório** no callback assíncrono
2. **Pelo menos um dos campos** (`fileUrl` ou `content`) deve ser fornecido
3. Se o N8N não retornar status, será assumido `"completed"` automaticamente
4. O sistema detecta automaticamente qual campo foi usado para cada tipo de dado
5. O conteúdo gerado é exibido em uma caixa de texto na interface, permitindo copiar ou baixar como `.txt`
