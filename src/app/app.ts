import { Component, signal, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('my-app-dsi6');

  constructor(private router: Router) {}

  // Esta señal verifica si estamos en login o register
  isAuthPage = computed(() => {
    const currentUrl = this.router.url;
    return currentUrl === '/login' || currentUrl === '/register';
  });
}
