import { Routes } from '@angular/router';
import { LoginComponent } from './features/pages/login/login.component';
import { RegisterComponent } from './features/pages/register/register.component';
import { ClienteListComponent} from './features/pages/cliente-list/cliente-list.component';
import { ProductoListComponent } from './features/pages/producto-list/producto-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'clientes', component: ClienteListComponent},
  { path: 'productos', component: ProductoListComponent },
  { path: '**', redirectTo: '/login' }
];