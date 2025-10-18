import { Routes } from '@angular/router';
import { LoginComponent } from './features/pages/login/login.component';
import { RegisterComponent } from './features/pages/register/register.component';
import { personaListComponent} from './features/pages/persona-list/persona-list.component';
import { ProductoListComponent } from './features/pages/producto-list/producto-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'personas', component: personaListComponent },
  { path: 'productos', component: ProductoListComponent },
  { path: '**', redirectTo: '/login' }
];