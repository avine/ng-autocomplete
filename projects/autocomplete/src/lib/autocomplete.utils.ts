import { AutocompleteItem } from './autocomplete.types';

export const getAutocompleteItem = (data: string | AutocompleteItem): AutocompleteItem =>
  typeof data === 'string' ? ({ value: data } as AutocompleteItem) : data;
