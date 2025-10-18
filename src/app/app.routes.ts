import { Routes } from '@angular/router';
import { personaListComponent } from './features/pages/persona-list/persona-list.component';
import { ProductoListComponent } from './features/pages/producto-list/producto-list.component';


export const routes: Routes = [
  {path: 'personas', component: personaListComponent},
  {path: 'productos', component: ProductoListComponent}
];
