import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  SubScript, 
  SubScriptCreateRequest, 
  SubScriptUpdateRequest, 
  SubScriptSearchRequest,
  SubScriptStatistics 
} from '../models/sub-script.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubScriptsService {
  private apiUrl = `${environment.apiUrl}/sub-scripts`;

  constructor(private http: HttpClient) {}

  getSubScripts(query?: any): Observable<SubScript[]> {
    let params = new HttpParams();
    
    if (query?.scenario_id) {
      params = params.set('scenario_id', query.scenario_id);
    }
    
    if (query?.status) {
      params = params.set('status', query.status);
    }

    return this.http.get<SubScript[]>(this.apiUrl, { params });
  }

  getSubScript(id: string): Observable<SubScript> {
    return this.http.get<SubScript>(`${this.apiUrl}/${id}`);
  }

  getSubScriptsByScenario(scenarioId: string): Observable<SubScript[]> {
    return this.http.get<SubScript[]>(`${this.apiUrl}/by-scenario/${scenarioId}`);
  }

  searchSubScriptsByKeywords(request: SubScriptSearchRequest): Observable<SubScript[]> {
    return this.http.post<SubScript[]>(`${this.apiUrl}/search-by-keywords`, request);
  }

  createSubScript(subScript: SubScriptCreateRequest): Observable<SubScript> {
    return this.http.post<SubScript>(this.apiUrl, subScript);
  }

  updateSubScript(id: string, subScript: SubScriptUpdateRequest): Observable<SubScript> {
    return this.http.patch<SubScript>(`${this.apiUrl}/${id}`, subScript);
  }

  toggleSubScriptStatus(id: string): Observable<SubScript> {
    return this.http.patch<SubScript>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  deleteSubScript(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStatistics(): Observable<SubScriptStatistics> {
    return this.http.get<SubScriptStatistics>(`${this.apiUrl}/statistics`);
  }
}