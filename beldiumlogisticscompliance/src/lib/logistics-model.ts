import { blankFields, type StringFields } from './demo-fields';
import type { Company, Vehicle, Driver } from './mock-data';
export const ORG_TYPES = ['Mineral Haulage Company','General Logistics and Transport Company','Fleet Owner / Fleet Operator','Third-Party Logistics Provider','Integrated Logistics and Warehousing Provider','Independent Transport Service Provider','Other Logistics Service Provider'];
export type WorkspaceRole = 'applicant' | 'manager' | 'driver';
export interface DemoUser { id: string; firstName: string; lastName: string; email: string; phone: string; organizationId: string; organizationName: string; organizationType: string; role: WorkspaceRole; driverId?: string | undefined }
export interface VehicleRecord extends Vehicle { maintenance: string; insuranceDeclared: boolean; roadworthinessDeclared: boolean; safetyDeclared: boolean; operatingStatus?: string; trackingCapability?: string; readiness: 'Draft' | 'Submitted' | 'Under Review' | 'Information Requested' | 'Demo Eligible' | 'Demo Restricted' }
export interface DriverRecord extends Driver { phone: string; relationship: string; base: string; available: boolean; mineralExperience?: string; emergencyContact?: string; safetyTrainingDeclared?: boolean; readiness: VehicleRecord['readiness'] }
export interface LogisticsComplianceRequirement { id: string; name: string; description: string; entity: string; category: string; required: boolean; applicable: boolean }
export interface EvidencePlaceholder { filename: string; declared: boolean }
export interface LogisticsApplication { organizationId: string; step: number; completed: number[]; identity: StringFields; representative: StringFields; operations: StringFields; officers: Record<string,string>; vehicles: VehicleRecord[]; drivers: DriverRecord[]; declarations: Record<string,boolean>; evidence: Record<string,EvidencePlaceholder>; acknowledgments: Record<string,boolean>; status: 'Draft' | 'Submitted'; reference?: string; submittedAt?: string }
export interface TransportMilestone { id: string; type: string; at: string; actor: string; location: string; evidence: string; notes: string }
export const TRIP_STAGES = ['Requested','Accepted','Scheduled','Mobilized','Arrived at Pickup','Loaded','In Transit','Arrived at Destination','Delivered','Closed'] as const;
export type TripStatus = typeof TRIP_STAGES[number] | 'Exception' | 'Cancelled' | 'Disputed';
export interface MineralCargo { reference: string; mineral: string; description: string; quantity: number; unit: string; loadedQuantity?: number | undefined; weighbridge?: string | undefined; seal?: string | undefined }
export interface DeliveryRecord { id: string; at: string; quantity: number; unit: string; receiver: string; representative: string; arrival: string; condition: string; weighbridge: string; filename: string; discrepancy: string; acknowledged: boolean; status: 'Delivery evidence submitted' | 'Delivery evidence reviewed' | 'Delivery accepted in demo' }
export interface OperationalException { id: string; at: string; type: string; notes: string; actor: string }
export interface TransportAssignment { id: string; organizationId: string; sector: string; rfq: string; cargo: MineralCargo; pickupOrganization: string; pickup: string; deliveryOrganization: string; destination: string; pickupDate: string; service: string; vehicleId: string; driverId: string; status: TripStatus; resumeStatus?: TripStatus | undefined; milestones: TransportMilestone[]; deliveries: DeliveryRecord[]; exceptions: OperationalException[] }
export const COMPLIANCE = {
 'Corporate registration': ['CAC incorporation evidence','Tax documentation','Authorized representative declaration','Business operating information'],
 'Transport regulatory readiness': ['Applicable operator registration','FRSC compliance declaration','RTSSS information where applicable','Vehicle registration','Roadworthiness evidence','Commercial insurance','Mineral transport authorization where applicable'],
 'Vehicle safety': ['Inspection procedures','Preventive maintenance','Tyre and braking controls','Load restraint','Axle-load controls','Emergency equipment','Breakdown response'],
 'Driver safety': ['Licence readiness','Driver competence','Safety induction','Fatigue management','Incident reporting','Driver fitness','Emergency response'],
 'Mineral cargo integrity': ['Cargo identification','Loading procedures','Weighbridge records','Cargo sealing where applicable','Material handling','Loss and discrepancy reporting','Chain of custody','Delivery verification'],
 'Environmental and operational risk': ['Spill prevention','Dust suppression','Environmental incident procedures','Route risk assessment','Journey management','Emergency response arrangements'],
};
export function requirements(d: LogisticsApplication): LogisticsComplianceRequirement[] {
 const mineral = d.identity.type === 'Mineral Haulage Company' || /mineral|bulk/i.test(d.operations.services || '');
 const leased = d.operations.ownership === 'Leased' || d.vehicles.some(v => v.ownership !== 'Owned');
 const container = d.vehicles.some(v => /container/i.test(v.type));
 const hazardous = /hazard|lead|chemical|tanker/i.test(`${d.operations.minerals} ${d.operations.cargo} ${d.vehicles.map(v => v.type).join(' ')}`);
 const interstate = (d.operations.states || '').split(',').filter(Boolean).length > 1;
 return [
 ['cac','CAC incorporation evidence','Corporate registration','Organization',true,true],
 ['tax','Tax documentation','Corporate registration','Organization',true,true],
 ['authority','Authorized representative declaration','Corporate registration','Representative',true,true],
 ['operator','Applicable transport authorization','Transport operator authorization','Organization',false,true],
 ['mineral','Applicable mineral haulage authorization','Transport operator authorization','Organization',true,mineral],
 ['vehicle','Vehicle registration and roadworthiness schedule','Fleet and vehicle documentation','Vehicles',true,true],
 ['lease','Lease / contracted fleet declaration','Fleet and vehicle documentation','Vehicles',true,leased],
 ['driver','Driver licence and competence schedule','Driver qualifications','Drivers',true,true],
 ['maintenance','Maintenance and safety procedures','Vehicle maintenance and safety','Vehicles',true,true],
 ['cargo','Cargo custody and delivery procedure','Cargo handling and traceability','Cargo',true,mineral],
 ['seal','Container seal procedure','Cargo handling and traceability','Cargo',true,container],
 ['insurance','Commercial vehicle insurance declaration','Insurance declarations','Vehicles',true,true],
 ['hse','Journey management and HSE declaration','Operational risk and HSE','Organization',true,true],
 ['hazard','Hazardous cargo handling procedure','Operational risk and HSE','Cargo',true,hazardous],
 ['corridor','Interstate corridor risk declaration','Operational risk and HSE','Operations',true,interstate],
 ].map(([id,name,category,entity,required,applicable]) => ({ id:String(id), name:String(name), description:'Applicant-declared evidence; applicability and statutory obligations require Beldium review.',category:String(category),entity:String(entity),required:Boolean(required),applicable:Boolean(applicable) }));
}
export function newDraft(user: DemoUser): LogisticsApplication { return { organizationId:user.organizationId, step:0, completed:[], identity:blankFields({name:user.organizationName,type:user.organizationType,email:user.email,telephone:user.phone}), representative:blankFields({name:`${user.firstName} ${user.lastName}`,email:user.email,phone:user.phone}),operations:blankFields(),officers:{},vehicles:[],drivers:[],declarations:{},evidence:{},acknowledgments:{},status:'Draft' }; }
export const STEP_NAMES = ['Organization identity','Authorized representative','Operating profile','Fleet registration','Driver registration','Compliance declarations','Evidence readiness','Review and submit'];
export const REQUIRED_FIELDS = [ ['name','cac','tin','email','telephone','address','state','lga','year','type','description'], ['name','title','email','phone','relationship','signatory','authority'], ['primaryService','services','experience','minerals','states','corridors','ownership','coverage','schedule','dispatch','monthlyCapacity','typicalQuantity','maximumLoad'] ];
export function missingForStep(d:LogisticsApplication, step:number):string[] {
 if(step<3){ const section = step===0?d.identity:step===1?d.representative:d.operations; return (REQUIRED_FIELDS[step] || []).filter(k=>!section[k]?.trim()); }
 if(step===3) return d.vehicles.length ? [] : ['At least one vehicle'];
 if(step===4) return d.drivers.length ? [] : ['At least one driver'];
 if(step===5) return Object.keys(COMPLIANCE).filter(k=>!d.declarations[k]);
 if(step===6) return requirements(d).filter(r=>r.applicable&&r.required&&(!d.evidence[r.id]?.declared||!d.evidence[r.id]?.filename)).map(r=>r.name);
 return ['accuracy','authority','notApproval'].filter(k=>!d.acknowledgments[k]);
}
export function submissionMissing(d:LogisticsApplication){return STEP_NAMES.flatMap((name,i)=>missingForStep(d,i).map(item=>`${name}: ${item}`));}
export function readiness(d:LogisticsApplication){ const applicable=requirements(d).filter(r=>r.applicable); return applicable.length?Math.round(100*applicable.filter(r=>d.evidence[r.id]?.declared&&d.evidence[r.id]?.filename).length/applicable.length):0; }
export function assignmentEligibility(c:Company | undefined, vehicleId:string, driverId:string, trips:TransportAssignment[]):string | null {
 if(!c)return 'Organization not found'; const v=c.vehicles.find(v=>v.id===vehicleId), d=c.drivers.find(d=>d.id===driverId);
 if(!v||!d)return 'Select a vehicle and driver belonging to this organization';
 if(v.status!=='Compliant'||d.status!=='Compliant')return 'Only Demo Eligible vehicles and drivers can be assigned';
 if(trips.some(t=>!['Closed','Cancelled'].includes(t.status)&&t.organizationId===c.id&&(t.vehicleId===vehicleId||t.driverId===driverId)))return 'Vehicle or driver already has an active assignment';
 return null;
}
export function toCompany(d:LogisticsApplication):Company {
 const i=d.identity; return {id:d.organizationId,name:i.name||'Draft organization',regId:i.tin||'Not declared',rcNumber:i.cac||'Not declared',location:i.address||'',state:i.state||'',country:'Nigeria',incorporated:i.year||'',fleetSize:d.vehicles.length,driverCount:d.drivers.length,status:d.status==='Submitted'?'Pending Review':'Pending Review',risk:'Medium',riskScore:0,submitted:d.submittedAt?.slice(0,10)||'Not submitted',reviewer:'Unassigned',lastActivity:new Date().toISOString().slice(0,10),contactName:d.representative.name||'',contactEmail:i.email||'',contactPhone:i.telephone||'',website:i.website||'',employees:0,annualTonnage:'Not verified',services:(d.operations.services||'').split(',').filter(Boolean),operatingLocations:[{name:'Registered operating base',type:'Head Office',address:i.address||'',staff:0}],scores:{fleet:0,drivers:0,insurance:0,safety:0,mineral:0},checks:Object.entries(COMPLIANCE).map(([label,items])=>({key:label.toLowerCase().replaceAll(' ','-'),label,description:'Applicant declarations awaiting simulated review',status:'pending',score:0,items:items.map(item=>({label:item,value:d.declarations[label]?'Declared':'Not declared',status:'pending'})),documentIds:[]})),documents:requirements(d).filter(r=>r.applicable&&d.evidence[r.id]?.filename).map(r=>({id:`${d.organizationId}-${r.id}`,name:r.name,category:r.category,type:'Placeholder',issuer:'Applicant declared',reference:(d.evidence[r.id]?.filename || ""),issued:'—',expires:'—',size:'Filename only',uploadedBy:d.representative.name||'Applicant',uploadedAt:d.submittedAt||'',status:'pending',notes:[]})),vehicles:d.vehicles,drivers:d.drivers,activity:[],declared:{identity:{...d.identity},representative:{...d.representative},officers:{...d.officers},operations:{...d.operations}}};
}
