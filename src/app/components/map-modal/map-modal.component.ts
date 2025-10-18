import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

// Importar Leaflet correctamente
import * as L from 'leaflet';

// Fix para los iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


@Component({
  selector: 'app-map-modal',
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './map-modal.component.html',
  styleUrl: './map-modal.component.css'
})

export class MapModalComponent implements AfterViewInit {
  private map: any;
  private marker: any;
  public uniqueId: string;

  constructor(
    public dialogRef: MatDialogRef<MapModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      nombre: string;
      apellidos: string;
      direccion: string;
      pais: string;
      departamento: string;
      provincia: string;
      distrito: string;
      coordenadas: string;
    }
  ) {
    this.uniqueId = this.generateUniqueId();
  }

  ngAfterViewInit(): void {
    // Esperar un tick para que el DOM se renderice completamente
    setTimeout(() => {
      this.initMap();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private generateUniqueId(): string {
    return 'map-' + Math.random().toString(36).substr(2, 9);
  }

  private initMap(): void {
    const coordinates = this.parseCoordinates(this.data.coordenadas);

    if (coordinates) {
      try {
        // Crear el mapa
        this.map = L.map(`map-${this.uniqueId}`).setView([coordinates.lat, coordinates.lng], 15);

        // Agregar capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(this.map);

        // Agregar marcador
        this.marker = L.marker([coordinates.lat, coordinates.lng])
          .addTo(this.map)
          .bindPopup(`
            <strong>${this.data.nombre} ${this.data.apellidos}</strong><br>
            ${this.data.direccion}<br>
            ${this.data.distrito}, ${this.data.provincia}
          `)
          .openPopup();

        // Ajustar el viewport para asegurar que el marcador sea visible
        setTimeout(() => {
          this.map.invalidateSize();
        }, 100);

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    } else {
      console.error('Coordenadas inválidas:', this.data.coordenadas);
    }
  }

  private parseCoordinates(coordenadas: string): { lat: number; lng: number } | null {
    if (!coordenadas) return null;

    try {
      const [latStr, lngStr] = coordenadas.split(',');
      const lat = parseFloat(latStr.trim());
      const lng = parseFloat(lngStr.trim());

      if (isNaN(lat) || isNaN(lng)) {
        return null;
      }

      return { lat, lng };
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return null;
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
