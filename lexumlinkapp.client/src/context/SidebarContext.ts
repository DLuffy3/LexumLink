import { createContext } from 'react';
import type { SidebarContextType } from './SidebarTypes';

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);
