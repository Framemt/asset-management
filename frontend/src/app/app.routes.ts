import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { AssetListComponent } from './components/asset-list/asset-list.component';
import { DisposedAssetsComponent } from './components/disposed-assets/disposed-assets.component';
import { PersonnelListComponent } from './components/personnel-list/personnel-list.component';
import { RequisitionComponent } from './components/requisition/requisition.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'assets', component: AssetListComponent, canActivate: [authGuard] },
  { path: 'disposed', component: DisposedAssetsComponent, canActivate: [authGuard] },
  { path: 'personnel', component: PersonnelListComponent, canActivate: [authGuard] },
  { path: 'requisition', component: RequisitionComponent, canActivate: [authGuard, adminGuard] },
  { path: '', redirectTo: 'assets', pathMatch: 'full' },
  { path: '**', redirectTo: 'assets' }
];
