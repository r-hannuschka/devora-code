import { InjectionToken, type Signal } from '@angular/core';
import type { DevoraCodeWidget } from '../interfaces/widget';

export const DEVORA_CODE_WIDGET = new InjectionToken<DevoraCodeWidget>(`Widget welches angezeigt wird`);
