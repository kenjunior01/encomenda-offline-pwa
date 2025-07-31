export const departmentThemes = {
  eletrodomesticos: {
    name: 'Eletrodomésticos',
    primary: 'bg-eletro-primary',
    secondary: 'bg-eletro-secondary',
    accent: 'bg-eletro-accent',
    text: 'text-white',
    gradient: 'bg-gradient-eletro',
    shadow: 'shadow-eletro',
    icon: '🏠',
    iconAlt: 'Geladeira'
  },
  alimentacao: {
    name: 'Alimentação',
    primary: 'bg-alimentacao-primary',
    secondary: 'bg-alimentacao-secondary',
    accent: 'bg-alimentacao-accent',
    text: 'text-white',
    gradient: 'bg-gradient-alimentacao',
    shadow: 'shadow-alimentacao',
    icon: '🛒',
    iconAlt: 'Cesta de compras'
  },
  cosmeticos: {
    name: 'Cosméticos',
    primary: 'bg-cosmeticos-primary',
    secondary: 'bg-cosmeticos-secondary',
    accent: 'bg-cosmeticos-accent',
    text: 'text-white',
    gradient: 'bg-gradient-cosmeticos',
    shadow: 'shadow-cosmeticos',
    icon: '💄',
    iconAlt: 'Cosméticos'
  }
} as const;

export type DepartmentType = keyof typeof departmentThemes;