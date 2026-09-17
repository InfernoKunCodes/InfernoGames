import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BaseService } from './base.service';

export interface EnvironmentSettings {
  production: boolean;
  baseUrl: string;
  restUrl: string;
  baseEndPoint: string;
  websocketUrl: string;
}
@Injectable({
  providedIn: 'root',
})
export class EnvironmentService extends BaseService {
  constructor(protected override http: HttpClient) {
    super(http);
  }

  configUrl = 'assets/environment/app.config.json';
  private configSettings: EnvironmentSettings | undefined = undefined;

  get settings() {
    return this.configSettings;
  }

  /**
   * Loads app.config.json before the app boots. Rejects on failure so the
   * initializer surfaces the error instead of leaving the app on a blank page.
   */
  public async load(): Promise<EnvironmentSettings> {
    try {
      const settings = await firstValueFrom(this.get<EnvironmentSettings>(this.configUrl));
      this.configSettings = settings;
      return settings;
    } catch (err) {
      console.error(`Error reading configuration file ${this.configUrl}:`, err);
      throw err;
    }
  }
}
