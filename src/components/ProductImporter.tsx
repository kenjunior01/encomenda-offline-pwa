import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useQueryClient } from '@tanstack/react-query';

interface ProductRow {
  nome: string;
  descricao?: string;
  preco: number;
  departamento: string;
  armazem?: string;
  ativo?: boolean;
}

export const ProductImporter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const queryClient = useQueryClient();

  const downloadTemplate = () => {
    const template = [
      {
        nome: 'Exemplo Produto 1',
        descricao: 'Descrição opcional do produto',
        preco: 100.50,
        departamento: 'eletrodomesticos',
        armazem: 'Armazém Principal',
        ativo: true
      },
      {
        nome: 'Exemplo Produto 2',
        descricao: '',
        preco: 250.00,
        departamento: 'alimentacao',
        armazem: '',
        ativo: true
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
    XLSX.writeFile(wb, 'template_produtos.xlsx');
    toast.success('Template baixado com sucesso!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const validateProduct = (product: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!product.nome || typeof product.nome !== 'string' || product.nome.trim().length === 0) {
      errors.push('Nome do produto é obrigatório');
    }

    if (!product.preco || isNaN(Number(product.preco)) || Number(product.preco) <= 0) {
      errors.push('Preço deve ser um número maior que 0');
    }

    if (!product.departamento || !['eletrodomesticos', 'alimentacao', 'cosmeticos'].includes(product.departamento)) {
      errors.push('Departamento deve ser: eletrodomesticos, alimentacao ou cosmeticos');
    }

    return { valid: errors.length === 0, errors };
  };

  const processFile = async () => {
    if (!file) {
      toast.error('Selecione um arquivo primeiro');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    const errors: string[] = [];
    let successCount = 0;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ProductRow[];

      if (jsonData.length === 0) {
        toast.error('O arquivo está vazio');
        setIsProcessing(false);
        return;
      }

      // Get warehouses for reference
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id, name, department');

      const warehouseMap = new Map(
        warehouses?.map(w => [`${w.name}-${w.department}`, w.id]) || []
      );

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)

        // Validate
        const validation = validateProduct(row);
        if (!validation.valid) {
          errors.push(`Linha ${rowNum}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Find warehouse ID if provided
        let warehouseId = null;
        if (row.armazem && row.armazem.trim()) {
          const key = `${row.armazem}-${row.departamento}`;
          warehouseId = warehouseMap.get(key) || null;
          if (!warehouseId) {
            errors.push(`Linha ${rowNum}: Armazém "${row.armazem}" não encontrado no departamento ${row.departamento}`);
          }
        }

        // Insert product
        const { error } = await supabase.from('products').insert({
          name: row.nome.trim(),
          description: row.descricao?.trim() || null,
          price: Number(row.preco),
          department: row.departamento,
          warehouse_id: warehouseId,
          active: row.ativo !== false, // Default to true if not specified
        });

        if (error) {
          errors.push(`Linha ${rowNum}: ${error.message}`);
        } else {
          successCount++;
        }

        setProgress(((i + 1) / jsonData.length) * 100);
      }

      setResults({ success: successCount, errors });
      
      if (successCount > 0) {
        toast.success(`${successCount} produtos importados com sucesso!`);
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
      
      if (errors.length > 0) {
        toast.error(`${errors.length} erros encontrados. Veja os detalhes abaixo.`);
      }

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Produtos via Excel
            </CardTitle>
            <CardDescription>
              Faça upload de um arquivo Excel com produtos para importação em massa
            </CardDescription>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Baixar Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <FileSpreadsheet className="h-4 w-4" />
          <AlertDescription>
            <strong>Formato do Excel:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li><strong>nome</strong>: Nome do produto (obrigatório)</li>
              <li><strong>descricao</strong>: Descrição (opcional)</li>
              <li><strong>preco</strong>: Preço em número (obrigatório)</li>
              <li><strong>departamento</strong>: eletrodomesticos, alimentacao ou cosmeticos (obrigatório)</li>
              <li><strong>armazem</strong>: Nome do armazém (opcional)</li>
              <li><strong>ativo</strong>: true ou false (opcional, padrão: true)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="file">Selecionar Arquivo Excel</Label>
          <Input
            id="file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Arquivo selecionado: {file.name}
            </p>
          )}
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <Label>Progresso da Importação</Label>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        <Button
          onClick={processFile}
          disabled={!file || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Importar Produtos
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-2 mt-4">
            {results.success > 0 && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>{results.success} produtos</strong> importados com sucesso!
                </AlertDescription>
              </Alert>
            )}

            {results.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{results.errors.length} erros encontrados:</strong>
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {results.errors.map((error, idx) => (
                      <div key={idx} className="text-xs">
                        • {error}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
