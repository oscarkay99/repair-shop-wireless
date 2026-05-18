export interface Repair {
  id: string;
  customer: string;
  device: string;
  deviceType: 'iPhone' | 'Android' | 'MacBook' | 'iPad' | 'Windows' | 'Other';
  issue: string;
  status: 'received' | 'diagnosed' | 'in_progress' | 'parts_pending' | 'ready' | 'completed' | 'cancelled';
  technician: string;
  eta: string;
  cost: string;
  costNum: number;
  started: string;
  completedDate?: string;
  warranty: boolean;
  parts: { name: string; status: string }[];
  notes: string[];
}

export const repairs: Repair[] = [
  // Active jobs
  { id: 'R-0042', customer: 'Kwame Asante',    device: 'iPhone 14 Pro Max',  deviceType: 'iPhone',  issue: 'Screen replacement + battery', status: 'ready',         technician: 'Ama O.',   eta: 'Today',    cost: 'GHS 850',   costNum: 850,   started: '2026-04-20', warranty: true,  parts: [{ name: 'OLED Display', status: 'installed' }, { name: 'Battery', status: 'installed' }], notes: ['Screen cracked from drop. Battery at 78% health.', 'Customer approved both repairs.'] },
  { id: 'R-0041', customer: 'Ama Owusu',        device: 'MacBook Air M2',     deviceType: 'MacBook', issue: 'Keyboard not responding',      status: 'in_progress',   technician: 'Yaw D.',   eta: 'Apr 24',   cost: 'GHS 1,200', costNum: 1200,  started: '2026-04-18', warranty: false, parts: [{ name: 'Top Case Assembly', status: 'ordered' }], notes: ['Liquid damage suspected. Diagnosing logic board.', 'Part ordered from supplier — ETA 2 days.'] },
  { id: 'R-0040', customer: 'Yaw Darko',        device: 'Samsung Galaxy S24', deviceType: 'Android', issue: 'Charging port loose',          status: 'diagnosed',     technician: 'Ama O.',   eta: 'Apr 25',   cost: 'GHS 320',   costNum: 320,   started: '2026-04-19', warranty: true,  parts: [{ name: 'Charging Port Flex', status: 'pending' }], notes: ['Port physically damaged. Needs replacement.', 'Waiting for customer approval on quote.'] },
  { id: 'R-0039', customer: 'Abena Frimpong',   device: 'iPhone 13',          deviceType: 'iPhone',  issue: 'Back glass cracked',           status: 'parts_pending', technician: 'Ama O.',   eta: 'Apr 26',   cost: 'GHS 450',   costNum: 450,   started: '2026-04-17', warranty: false, parts: [{ name: 'Back Glass Panel', status: 'ordered' }], notes: ['Cosmetic damage only. Phone fully functional.', 'Customer wants original color match.'] },
  { id: 'R-0038', customer: 'Kofi Mensah',      device: 'iPad Pro 12.9"',     deviceType: 'iPad',    issue: 'No power / won\'t charge',    status: 'received',      technician: 'Yaw D.',   eta: 'Apr 27',   cost: 'TBD',       costNum: 0,     started: '2026-04-22', warranty: true,  parts: [], notes: ['Device completely dead. Needs full diagnostic.', 'Under warranty — no cost to customer.'] },
  { id: 'R-0037', customer: 'Akosua Boateng',   device: 'MacBook Pro 14"',    deviceType: 'MacBook', issue: 'Trackpad erratic',             status: 'ready',         technician: 'Yaw D.',   eta: 'Today',    cost: 'GHS 380',   costNum: 380,   started: '2026-04-15', warranty: false, parts: [{ name: 'Trackpad Assembly', status: 'installed' }], notes: ['Trackpad cable loose. Re-seated and tested.', 'Quality check passed. Ready for pickup.'] },
  { id: 'R-0036', customer: 'Nana Ama Sarpong', device: 'iPhone 15',          deviceType: 'iPhone',  issue: 'Face ID not working',          status: 'in_progress',   technician: 'Ama O.',   eta: 'Apr 24',   cost: 'GHS 600',   costNum: 600,   started: '2026-04-21', warranty: false, parts: [{ name: 'TrueDepth Camera', status: 'ordered' }], notes: ['Face ID module damaged. Waiting for genuine part.'] },
  { id: 'R-0035', customer: 'Kwabena Appiah',   device: 'Dell XPS 15',        deviceType: 'Windows', issue: 'Battery swollen',              status: 'parts_pending', technician: 'Yaw D.',   eta: 'Apr 28',   cost: 'GHS 720',   costNum: 720,   started: '2026-04-20', warranty: false, parts: [{ name: 'Laptop Battery 97Wh', status: 'ordered' }], notes: ['Battery causing palm rest to bulge. Urgent replacement.'] },
  // Completed this month
  { id: 'R-0034', customer: 'Efua Asante',      device: 'iPhone 12',          deviceType: 'iPhone',  issue: 'Screen cracked',               status: 'completed',     technician: 'Ama O.',   eta: '—',        cost: 'GHS 550',   costNum: 550,   started: '2026-04-14', completedDate: '2026-04-17', warranty: false, parts: [], notes: [] },
  { id: 'R-0033', customer: 'Fiifi Mensah',     device: 'Samsung A54',        deviceType: 'Android', issue: 'Speaker not working',          status: 'completed',     technician: 'Yaw D.',   eta: '—',        cost: 'GHS 280',   costNum: 280,   started: '2026-04-13', completedDate: '2026-04-16', warranty: false, parts: [], notes: [] },
  { id: 'R-0032', customer: 'Adwoa Sarfo',      device: 'MacBook Air M1',     deviceType: 'MacBook', issue: 'Battery replacement',          status: 'completed',     technician: 'Yaw D.',   eta: '—',        cost: 'GHS 950',   costNum: 950,   started: '2026-04-12', completedDate: '2026-04-15', warranty: true,  parts: [], notes: [] },
  { id: 'R-0031', customer: 'Kofi Acheampong',  device: 'iPhone 14',          deviceType: 'iPhone',  issue: 'Charging issue',               status: 'completed',     technician: 'Ama O.',   eta: '—',        cost: 'GHS 320',   costNum: 320,   started: '2026-04-11', completedDate: '2026-04-13', warranty: false, parts: [], notes: [] },
  { id: 'R-0030', customer: 'Akua Bonsu',       device: 'iPad Air 5',         deviceType: 'iPad',    issue: 'Screen replacement',           status: 'completed',     technician: 'Yaw D.',   eta: '—',        cost: 'GHS 680',   costNum: 680,   started: '2026-04-10', completedDate: '2026-04-14', warranty: false, parts: [], notes: [] },
  { id: 'R-0029', customer: 'Paa Kwesi Brew',   device: 'Huawei P50',         deviceType: 'Android', issue: 'Fingerprint sensor failure',   status: 'completed',     technician: 'Ama O.',   eta: '—',        cost: 'GHS 410',   costNum: 410,   started: '2026-04-09', completedDate: '2026-04-12', warranty: false, parts: [], notes: [] },
  { id: 'R-0028', customer: 'Esi Quaye',        device: 'iPhone 13 Pro',      deviceType: 'iPhone',  issue: 'Water damage',                 status: 'completed',     technician: 'Ama O.',   eta: '—',        cost: 'GHS 1,100', costNum: 1100,  started: '2026-04-08', completedDate: '2026-04-11', warranty: false, parts: [], notes: [] },
  { id: 'R-0027', customer: 'Nana Yaw Adom',    device: 'Lenovo ThinkPad',    deviceType: 'Windows', issue: 'Keyboard replacement',         status: 'completed',     technician: 'Yaw D.',   eta: '—',        cost: 'GHS 480',   costNum: 480,   started: '2026-04-07', completedDate: '2026-04-10', warranty: false, parts: [], notes: [] },
  { id: 'R-0026', customer: 'Abena Kyei',       device: 'Samsung S23',        deviceType: 'Android', issue: 'Camera lens cracked',          status: 'completed',     technician: 'Ama O.',   eta: '—',        cost: 'GHS 360',   costNum: 360,   started: '2026-04-06', completedDate: '2026-04-09', warranty: false, parts: [], notes: [] },
  { id: 'R-0025', customer: 'Kwame Osei',       device: 'iPhone 15 Pro',      deviceType: 'iPhone',  issue: 'Battery drain',                status: 'completed',     technician: 'Yaw D.',   eta: '—',        cost: 'GHS 420',   costNum: 420,   started: '2026-04-05', completedDate: '2026-04-08', warranty: true,  parts: [], notes: [] },
  { id: 'R-0024', customer: 'Maame Serwaa',     device: 'iPad Pro 11"',       deviceType: 'iPad',    issue: 'Home button not working',      status: 'completed',     technician: 'Ama O.',   eta: '—',        cost: 'GHS 290',   costNum: 290,   started: '2026-04-04', completedDate: '2026-04-07', warranty: false, parts: [], notes: [] },
  { id: 'R-0023', customer: 'Kwadwo Ennin',     device: 'MacBook Pro M3',     deviceType: 'MacBook', issue: 'Display flickering',           status: 'completed',     technician: 'Yaw D.',   eta: '—',        cost: 'GHS 1,400', costNum: 1400,  started: '2026-04-03', completedDate: '2026-04-06', warranty: false, parts: [], notes: [] },
];

export const repairStats = [
  { label: 'Active Repairs', value: '8',        change: '+2', icon: 'ri-tools-line',         accent: 'bg-blue-500'    },
  { label: 'Ready for Pickup', value: '2',       change: '+1', icon: 'ri-check-double-line',  accent: 'bg-emerald-500' },
  { label: 'Avg Turnaround',  value: '3.2 days', change: '-0.4', icon: 'ri-time-line',        accent: 'bg-amber-500'   },
  { label: 'Pending Approval', value: '1',       change: '0',  icon: 'ri-hourglass-line',     accent: 'bg-red-500'     },
];
