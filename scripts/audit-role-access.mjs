import assert from 'node:assert/strict';
import {
  canAccessModule,
  canViewAdminDashboard,
  getLandingPath,
} from '../src/utils/access.ts';

const user = (role, dashboardVariant, permissions = [], scoped = false) => ({
  role,
  dashboardVariant,
  permissions,
  scopeTicketsToTechnician: scoped,
});

const technician = user('technician', 'technician', ['ticket_parts:create', 'parts:view'], true);
const receptionist = user('receptionist', 'receptionist', ['tickets:view', 'customers:view', 'invoices:view']);
const inventory = user('stock_manager', 'inventory_portal', ['parts:view', 'parts:edit']);
const sales = user('sales_manager', 'sales_manager', ['sales:view', 'invoices:view']);
const manager = user('manager', 'admin', ['dashboard:admin', 'expenses:view']);
const finance = user('finance', 'finance', ['expenses:view', 'invoices:view', 'payments:view']);
const hr = user('hr', 'hr', ['attendance:view', 'hr_documents:view']);
const unknown = user('custom_unknown', 'admin', []);
const spoofedTechnician = user('technician', 'admin', ['dashboard:admin'], false);
const spoofedReceptionist = user('receptionist', 'inventory_portal', ['parts:view']);
const spoofedManager = user('manager', 'technician', [], true);
const spoofedCustomPortal = user('custom_unknown', 'technician', ['dashboard:admin'], true);

assert.equal(getLandingPath(technician), '/tech-portal');
assert.equal(getLandingPath(receptionist), '/reception');
assert.equal(getLandingPath(inventory), '/inventory-portal');
assert.equal(getLandingPath(sales), '/');
assert.equal(getLandingPath(manager), '/');
assert.equal(getLandingPath(finance), '/expenses');
assert.equal(getLandingPath(hr), '/hr');
assert.equal(getLandingPath(unknown), '/access-denied');
assert.equal(getLandingPath(spoofedTechnician), '/tech-portal');
assert.equal(getLandingPath(spoofedReceptionist), '/reception');
assert.equal(getLandingPath(spoofedManager), '/');
assert.equal(getLandingPath(spoofedCustomPortal), '/access-denied');

assert.equal(canViewAdminDashboard(technician), false);
assert.equal(canViewAdminDashboard(manager), true);
assert.equal(canAccessModule(technician, 'Technician Portal'), true);
assert.equal(canAccessModule(technician, 'Reception Portal'), false);
assert.equal(canAccessModule(technician, 'Inventory Portal'), false);
assert.equal(canAccessModule(receptionist, 'Technician Portal'), false);
assert.equal(canAccessModule(receptionist, 'Inventory Portal'), false);
assert.equal(canAccessModule(inventory, 'Reception Portal'), false);
assert.equal(canAccessModule(unknown, 'Dashboard'), false);
assert.equal(canAccessModule(finance, 'Payments'), true);
assert.equal(canAccessModule(spoofedTechnician, 'Reception Portal'), false);
assert.equal(canAccessModule(spoofedTechnician, 'Inventory Portal'), false);
assert.equal(canAccessModule(spoofedCustomPortal, 'Technician Portal'), false);

console.log('Role authorization matrix: all assertions passed.');
