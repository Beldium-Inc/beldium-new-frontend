"""Seed a LOCAL Beldium backend with logistics test data for manual testing.

Run from the backend folder, against a local development database only:

    LOGISTICS_SEED_PASSWORD='choose-a-test-password' \\
      .venv/bin/python manage.py shell < ../beldium-new-frontend/llogisticsportal/scripts/seed_local_backend.py

It refuses to run unless DEBUG is on and the database is local. Running it twice
reuses what already exists. Accounts created (all use LOGISTICS_SEED_PASSWORD):

    ops@logistics.test        owner of "Test Haulage Ltd" (approved operator)
    staff@logistics.test      member of the same company (read-mostly)
    applicant@logistics.test  verified account with no company (onboarding)
"""

import os
from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.utils import timezone

from accounts.models import User
from logistics import models as m
from logistics import services
from organisations.models import Organisation, OrganisationMembership

db = connection.settings_dict
if not settings.DEBUG or db.get("HOST") not in ("", None, "localhost", "127.0.0.1"):
    raise SystemExit("Refusing to seed: DEBUG must be on and the database must be local.")

PASSWORD = os.environ.get("LOGISTICS_SEED_PASSWORD")
if not PASSWORD:
    raise SystemExit("Set LOGISTICS_SEED_PASSWORD to the password the test accounts should use.")

now = timezone.now()
today = timezone.localdate()


def user(email, first):
    u, created = User.objects.get_or_create(email=email, defaults={"first_name": first, "last_name": "Tester"})
    if created:
        u.set_password(PASSWORD)
        u.phone_number = "+2348012345678"
    u.email_verified_at = u.email_verified_at or now
    u.save()
    return u


ops = user("ops@logistics.test", "Ops")
staff = user("staff@logistics.test", "Staff")
user("applicant@logistics.test", "Applicant")

org, _ = Organisation.objects.get_or_create(
    name="Test Haulage Ltd",
    organisation_type="logistics_company",
    defaults={"registration_number": "RC 000001", "verification_status": "verified"},
)
OrganisationMembership.objects.get_or_create(organisation=org, user=ops, defaults={"role": "owner"})
OrganisationMembership.objects.get_or_create(organisation=org, user=staff, defaults={"role": "member"})

co, _ = m.LogisticsCompany.objects.get_or_create(
    organisation=org,
    defaults={"contact_name": "Ops Tester", "contact_email": "ops@logistics.test",
              "contact_phone": "+2348012345678", "services": ["Mineral Haulage", "Sample Transportation"]},
)
app = m.LogisticsApplication.objects.filter(company=co).first()
if not app:
    app = m.LogisticsApplication.objects.create(company=co, created_by=ops, status="approved", submitted_at=now)
    services.initialise(app)

if not m.Vehicle.objects.filter(company=co).exists():
    def veh(reg, ins=200, road=200):
        return m.Vehicle.objects.create(
            company=co, registration=reg, vin="VIN-" + reg, vehicle_type="Tipper", make="MAN", model="TGS",
            year=2021, capacity=30, capacity_unit="tonnes", ownership="owned",
            insurance_expiry=today + timedelta(days=ins), roadworthiness_expiry=today + timedelta(days=road))

    def drv(name, lic=200, med=200):
        return m.Driver.objects.create(
            company=co, full_name=name, licence_number="LIC-" + name, licence_class="E",
            licence_expiry=today + timedelta(days=lic), medical_expiry=today + timedelta(days=med))

    veh("KD-OK-1"); veh("KD-OK-2"); busy_v = veh("KD-BUSY")
    veh("KD-INS-EXPIRED", ins=-1); veh("KD-ROAD-EXPIRED", road=-1)
    drv("Driver OK"); drv("Driver OK 2"); busy_d = drv("Driver Busy")
    drv("Driver Licence Expired", lic=-1); drv("Driver Medical Expired", med=-1)

    m.Movement.objects.create(company=co, movement_type="Mine to Warehouse", mineral="Tin", quantity=10,
                              origin="Jos", destination="Kaduna", status="in_transit",
                              vehicle=busy_v, driver=busy_d)
    for i, (kind, mineral, qty) in enumerate([("Mine to Warehouse", "Tin", 20), ("Mine to Processor", "Columbite", 15),
                                              ("Mine to Laboratory", "Lithium", 0.5)]):
        m.TransportRequest.objects.create(
            company=co, movement_type=kind, requester="Test Buyer Ltd", miner="Test Miner Co", buyer="Test Buyer Ltd",
            mineral=mineral, quantity=qty, origin="Jos", destination="Kaduna",
            required_pickup_at=now + timedelta(hours=6 + i), rfq_id=f"RFQ-T{i}", transaction_id=f"TXN-T{i}")
    m.ScopeRestriction.objects.create(company=co, service_scope="Restricted Haul", reason="Manual test restriction")
    m.ComplianceFinding.objects.create(company=co, area="Fleet", detail="KD-INS-EXPIRED insurance has lapsed.")
    txn = m.LogisticsTransaction.objects.create(
        company=co, transaction_id="TXN-T0", rfq_id="RFQ-T0", buyer="Test Buyer Ltd", miner="Test Miner Co",
        material="Tin", quantity=20, origin="Jos", destination="Kaduna", transport_fee=450000,
        stage="Awaiting pickup", delivery_status="pending", payment_status="not_invoiced")
    m.LogisticsPayment.objects.create(company=co, transaction=txn, job_value=450000, due_amount=450000, paid_amount=150000,
                                      status="part_paid")
    m.OperationsEvent.objects.create(company=co, occurred_at=now, text="Seed data loaded", sector="Logistics", unread=True)
    m.ActionItem.objects.create(company=co, action="Renew insurance", target="KD-INS-EXPIRED", urgency="High")
    for u in (ops, staff):
        m.Notification.objects.create(company=co, recipient=u, title="Welcome", body=f"Test note for {u.email}")

print("Seeded:", co.reference, "| accounts: ops@logistics.test, staff@logistics.test, applicant@logistics.test")
