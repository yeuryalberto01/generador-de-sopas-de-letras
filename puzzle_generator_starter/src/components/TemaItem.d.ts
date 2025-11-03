import { Tema } from '../types';

export interface TemaItemProps {
  tema: Tema;
  onDelete: (id: string) => void;
  onEdit: (tema: Tema) => void;
  onUpdate: (id: string, title: string, words: string[]) => void;
  loading: boolean;
  showToast?: (message: string, type?: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

declare const TemaItem: React.ComponentType<TemaItemProps>;
export default TemaItem;