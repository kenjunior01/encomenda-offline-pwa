# 📦 Sistema de Encomendas PWA - Manual Completo

## 🎯 Visão Geral

Sistema profissional de gestão de encomendas com controle por departamentos, aprovações hierárquicas, permissões granulares e suporte offline completo (PWA).

### Funcionalidades Principais

✅ **Gestão de Encomendas**
- Criação de pedidos por departamento
- Seleção de produtos com busca em tempo real
- Cálculo automático de totais
- Geração de PDF profissional
- Status: Pendente → Aprovada/Rejeitada → Entregue

✅ **Sistema de Aprovação**
- Supervisores e admins podem aprovar/rejeitar
- Notificações em tempo real
- Histórico completo de alterações
- Controle por departamento

✅ **Permissões Granulares**
- Admin pode definir permissões específicas por usuário
- 25+ tipos de permissões (ver, criar, editar, excluir, aprovar, etc.)
- Escopo por departamento ou global
- Controle fino de acesso

✅ **Importação em Massa**
- Upload de produtos via Excel
- Template disponível para download
- Validação automática de dados
- Relatório detalhado de erros

✅ **PWA Completo**
- Funciona 100% offline
- Instalável em celular e desktop
- Cache inteligente
- Sincronização automática
- Indicador de status online/offline

✅ **Dashboard Analytics**
- Visão geral por departamento
- Métricas de encomendas
- Gestão de produtos e usuários
- Exportação de relatórios

## 👥 Perfis de Usuário

### 1. Admin Geral (`admin@mz.dimd`)
**Permissões:** Acesso total ao sistema
- Ver todos os departamentos
- Gerenciar usuários e permissões
- Aprovar encomendas de qualquer departamento
- Importar produtos em massa
- Exportar relatórios completos
- Configurar armazéns

### 2. Supervisor/Manager
**Exemplos:**
- `manager@mz.dimd` (Supervisor Geral)
- `manager@maputo.dimd` (Supervisor de Maputo)

**Permissões:** Gestão do(s) departamento(s)
- Ver e aprovar encomendas do departamento
- Gerenciar produtos do departamento
- Ver relatórios do departamento
- Editar informações de clientes
- Exportar dados do departamento

### 3. Vendedor/Seller
**Exemplos:**
- `seller@maputo.dimd` (Vendedor Maputo)
- `seller@beira.dimd` (Vendedor Beira)
- `seller@nampula.dimd` (Vendedor Nampula)

**Permissões:** Operação básica
- Criar encomendas no seu departamento
- Ver próprias encomendas
- Cadastrar clientes
- Ver produtos do departamento
- Gerar PDF de pedidos

## 🚀 Guia de Uso

### Para Vendedores

#### 1. Criar Nova Encomenda
1. Acesse o dashboard
2. Clique no card do departamento desejado
3. Selecione ou cadastre o cliente
4. Adicione produtos usando a busca
5. Ajuste quantidades conforme necessário
6. Adicione observações (opcional)
7. Clique em "Criar Encomenda"
8. Baixe o PDF gerado

#### 2. Ver Histórico
1. Clique em "Minhas Encomendas"
2. Filtre por status ou período
3. Clique em "Ver PDF" para visualizar
4. Acompanhe o status das aprovações

### Para Supervisores

#### 1. Aprovar Encomendas
1. Acesse o dashboard
2. Visualize encomendas pendentes
3. Clique em "Ver Detalhes"
4. Analise itens e valores
5. Aprove ou rejeite com justificativa
6. O vendedor é notificado automaticamente

#### 2. Gerenciar Produtos
1. Acesse aba "Produtos"
2. Visualize lista completa
3. Edite informações conforme necessário
4. Ative/desative produtos

### Para Administradores

#### 1. Importar Produtos em Massa
1. Acesse Dashboard → Aba "Produtos"
2. Clique em "Baixar Template"
3. Preencha o Excel com os dados:
   - **nome**: Nome do produto (obrigatório)
   - **descricao**: Descrição detalhada (opcional)
   - **preco**: Valor numérico (obrigatório)
   - **departamento**: eletrodomesticos, alimentacao ou cosmeticos
   - **armazem**: Nome do armazém (opcional)
   - **ativo**: true ou false (padrão: true)
4. Selecione o arquivo preenchido
5. Clique em "Importar Produtos"
6. Aguarde o processamento
7. Verifique relatório de sucesso/erros

**Exemplo de linha no Excel:**
```
nome: Geladeira Frost Free 450L
descricao: Geladeira duplex com sistema frost free e freezer espaçoso
preco: 2500.00
departamento: eletrodomesticos
armazem: Armazém Central Maputo
ativo: true
```

#### 2. Gerenciar Permissões
1. Acesse Dashboard → "Permissões"
2. Selecione o usuário
3. Defina o escopo (departamento específico ou todos)
4. Marque as permissões desejadas:
   - **Encomendas**: view, create, edit, delete, approve, reject
   - **Produtos**: view, create, edit, delete
   - **Clientes**: view, create, edit, delete
   - **Usuários**: view, create, edit, delete
   - **Armazéns**: view, create, edit, delete
   - **Outros**: view_reports, export_data, manage_permissions
5. Clique em "Salvar Permissões"

#### 3. Exportar Relatórios
1. Acesse aba "Relatórios"
2. Selecione o período desejado
3. Escolha o departamento (ou todos)
4. Clique em "Exportar CSV"
5. Arquivo será baixado automaticamente

## 📱 Instalação PWA

### Android
1. Abra o sistema no Chrome
2. Toque no menu (⋮) → "Instalar app"
3. Confirme a instalação
4. Ícone aparecerá na tela inicial

### iPhone/iPad
1. Abra no Safari
2. Toque no botão Compartilhar
3. Selecione "Adicionar à Tela de Início"
4. Confirme com "Adicionar"

### Desktop (Windows/Mac/Linux)
1. Abra no Chrome/Edge
2. Clique no ícone de instalação na barra de endereço
3. Confirme "Instalar"
4. App aparecerá como programa independente

## 🔒 Segurança

### Autenticação
- Sistema usa Supabase Auth
- Senhas criptografadas
- Sessões seguras com tokens JWT
- Logout automático após inatividade

### Row Level Security (RLS)
- Políticas de acesso por usuário
- Isolamento de dados por departamento
- Proteção contra acesso não autorizado
- Validação em nível de banco de dados

### Permissões Granulares
- Controle fino de acesso
- Validação server-side
- Security definer functions
- Auditoria de ações

## 🌐 Modo Offline

### Funcionalidades Offline
- Visualizar encomendas já carregadas
- Consultar produtos em cache
- Ver histórico de pedidos
- Gerar PDFs de pedidos salvos

### Sincronização
- Automática quando voltar online
- Indicador visual de status
- Notificações de sincronização
- Cache inteligente de dados

## 📊 Estrutura de Dados

### Departamentos Disponíveis
1. **eletrodomesticos**: Linha branca, eletrônicos
2. **alimentacao**: Alimentos, bebidas, supermercado
3. **cosmeticos**: Beleza, higiene, perfumaria

### Status de Encomendas
1. **pendente**: Aguardando aprovação
2. **aprovada**: Aprovada pelo supervisor
3. **rejeitada**: Recusada pelo supervisor
4. **entregue**: Entregue ao cliente

## 🛠️ Configuração Técnica

### Requisitos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conexão com internet (primeira vez)
- Espaço em disco para cache (aprox. 50MB)

### URLs Importantes
- **Dashboard Supabase**: https://supabase.com/dashboard/project/sxhfuxmuzsditfgsrbdi
- **Autenticação**: https://supabase.com/dashboard/project/sxhfuxmuzsditfgsrbdi/auth/users
- **Banco de Dados**: https://supabase.com/dashboard/project/sxhfuxmuzsditfgsrbdi/editor
- **Edge Functions**: https://supabase.com/dashboard/project/sxhfuxmuzsditfgsrbdi/functions

## 📞 Suporte

### Problemas Comuns

**1. "Não consigo fazer login"**
- Verifique se o email está correto
- Senha é case-sensitive
- Limpe cache do navegador
- Contate admin para reset de senha

**2. "Produtos não aparecem"**
- Verifique sua conexão
- Confirme permissões com admin
- Limpe cache e recarregue
- Verifique se produtos estão ativos

**3. "Não consigo aprovar encomendas"**
- Verifique se você é supervisor/admin
- Confirme permissões necessárias
- Verifique se encomenda está pendente
- Tente recarregar a página

**4. "Erro ao importar Excel"**
- Use o template fornecido
- Verifique formato das colunas
- Departamento deve ser exato
- Preço deve ser número sem símbolos
- Veja relatório de erros detalhado

**5. "App não funciona offline"**
- Certifique-se que instalou como PWA
- Navegue online uma vez primeiro
- Verifique espaço em disco
- Reinstale o PWA se necessário

## 📈 Boas Práticas

### Para Vendedores
- ✅ Sempre preencha dados completos do cliente
- ✅ Adicione observações relevantes nas encomendas
- ✅ Verifique quantidades antes de confirmar
- ✅ Baixe PDF imediatamente após criar pedido
- ✅ Acompanhe status das aprovações regularmente

### Para Supervisores
- ✅ Revise encomendas pendentes diariamente
- ✅ Forneça justificativas claras nas rejeições
- ✅ Mantenha produtos atualizados
- ✅ Monitore métricas do departamento
- ✅ Exporte relatórios mensalmente

### Para Administradores
- ✅ Faça backup regular dos dados
- ✅ Revise permissões periodicamente
- ✅ Monitore usuários inativos
- ✅ Mantenha produtos e armazéns organizados
- ✅ Acompanhe métricas gerais do sistema

## 🔄 Atualizações

O sistema é atualizado automaticamente quando:
- Frontend: Ao clicar em "Update" no dashboard
- Backend: Automaticamente após deployments
- PWA: Recarrega automaticamente após updates

## 📝 Notas Técnicas

### Performance
- Cache agressivo para velocidade
- Lazy loading de imagens
- Paginação de dados grandes
- Otimização de queries

### Compatibilidade
- Chrome/Edge: 100%
- Firefox: 100%
- Safari: 100%
- Mobile browsers: 100%

### Limites
- Upload Excel: 20MB por arquivo
- Cache offline: ~50MB
- Sessão: 24h de inatividade
- PDF gerado: Até 100 itens por encomenda

---

**Versão do Sistema:** 2.0
**Última Atualização:** Janeiro 2025
**Desenvolvido com:** React + TypeScript + Supabase + Vite PWA
