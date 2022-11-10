import { Accordion, Button, Group, Paper, ScrollArea, Tabs, Text } from '@mantine/core';
import { formatDateTime, getPropertyDisplayName } from '@medplum/core';
import {
  Appointment,
  CodeableConcept,
  DiagnosticReport,
  DocumentReference,
  Patient,
  RequestGroup,
  Resource,
  ResourceType,
  ServiceRequest,
} from '@medplum/fhirtypes';
import {
  CodeableConceptDisplay,
  DiagnosticReportDisplay,
  Document,
  MedplumLink,
  RequestGroupDisplay,
  ResourceTable,
  StatusBadge,
  useMedplum,
} from '@medplum/react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loading } from '../components/Loading';
import { PatientHeader } from './PatientHeader';
import { TaskHeader } from './TaskHeader';

interface PatientGraphQLResponse {
  data: {
    patient: Patient;
    appointments: Appointment[];
    orders: ServiceRequest[];
    reports: DiagnosticReport[];
    requestGroups: RequestGroup[];
    clinicalNotes: DocumentReference[];
  };
}

export function PatientPage(): JSX.Element {
  const navigate = useNavigate();
  const params = useParams() as { id: string; tab: string; resourceId: string };
  const { id, resourceId } = params;

  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('task');

  const medplum = useMedplum();
  const resource = (resourceId && medplum.readResource(params.tab as ResourceType, resourceId).read()) as Resource;

  const [response, setResponse] = useState<PatientGraphQLResponse>();

  useEffect(() => {
    const query = `{
      patient: Patient(id: "${id}") {
        resourceType,
        id,
        meta { lastUpdated },
        birthDate,
        name { given, family },
        telecom { system, value },
        address { line, city, state },
        photo { contentType, url }
      },
      appointments: AppointmentList(actor: "Patient/${id}") {
        resourceType,
        id,
        meta { lastUpdated },
        serviceCategory { text, coding { code, display } },
        serviceType { text, coding { code, display } },
        start,
        end,
        status
      },
      orders: ServiceRequestList(subject: "Patient/${id}") {
        resourceType,
        id,
        meta { lastUpdated },
        category { text, coding { code, display } },
        code { text, coding { code, display } },
        status
      },
      reports: DiagnosticReportList(subject: "Patient/${id}") {
        resourceType,
        id,
        meta { lastUpdated },
        code { text }
      },
      requestGroups: RequestGroupList(subject: "Patient/${id}") {
        resourceType,
        id,
        status,
        meta { lastUpdated },
        code { text },
        action { id, title, resource { reference } }
      },
      clinicalNotes: DocumentReferenceList(category: "clinical-note" patient: "Patient/${id}") {
        resourceType,
        id,
        description,
        type { text, coding { code } }
        content { attachment { url} }
      }
    }`;
    medplum.graphql(query).then(setResponse);
  }, [medplum, id]);

  if (!response) {
    return <Loading />;
  }

  const { patient, appointments, orders, reports, requestGroups, clinicalNotes } = response.data;

  const allResources = [...appointments, ...orders, ...reports];
  allResources.sort((a, b) => (a.meta?.lastUpdated as string).localeCompare(b.meta?.lastUpdated as string));

  const tab = resolveTab(params.tab);

  return (
    <>
      {taskId && <TaskHeader taskId={taskId} />}
      <PatientHeader key={id} patient={patient} />
      <Tabs value={tab} onTabChange={(newTab) => navigate(`/Patient/${id}/${newTab}?task=${taskId}`)}>
        <Paper>
          <ScrollArea>
            <Tabs.List style={{ whiteSpace: 'nowrap', flexWrap: 'nowrap' }}>
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="visits">Visits</Tabs.Tab>
              <Tabs.Tab value="labreports">Labs &amp; Imaging</Tabs.Tab>
              <Tabs.Tab value="medication">Medication</Tabs.Tab>
              <Tabs.Tab value="careplans">Care Plans</Tabs.Tab>
              <Tabs.Tab value="forms">Forms</Tabs.Tab>
              <Tabs.Tab value="clinicalnotes">Clinical Notes</Tabs.Tab>
            </Tabs.List>
          </ScrollArea>
        </Paper>
        <Document>
          <Tabs.Panel value="overview">
            <OverviewTab id={id} taskId={taskId} allResources={allResources} />
          </Tabs.Panel>
          <Tabs.Panel value="visits">
            <VisitsTab appointments={appointments} />
          </Tabs.Panel>
          <Tabs.Panel value="labreports">
            <LabAndImagingTab patient={patient} orders={orders} resource={resource} />
          </Tabs.Panel>
          <Tabs.Panel value="medication">
            <MedicationTab patient={patient} />
          </Tabs.Panel>
          <Tabs.Panel value="careplans">
            <CarePlansTab requestGroups={requestGroups} />
          </Tabs.Panel>
          <Tabs.Panel value="forms">
            <FormsTab />
          </Tabs.Panel>
          <Tabs.Panel value="clinicalnotes">
            <ClinicalNotesTab clinicalNotes={clinicalNotes} />
          </Tabs.Panel>
        </Document>
      </Tabs>
    </>
  );
}

function OverviewTab({
  allResources,
  id,
  taskId,
}: {
  allResources: Resource[];
  id: string;
  taskId: string | null;
}): JSX.Element {
  return (
    <>
      <h2>Overview</h2>
      <ul>
        {allResources.map((resource) => (
          <li key={resource.id}>
            <MedplumLink to={`/Patient/${id}/${resource.resourceType}/${resource.id}?task=${taskId}`}>
              {getPropertyDisplayName(resource.resourceType)}
            </MedplumLink>
            <br />
            <small>{formatDateTime(resource.meta?.lastUpdated)}</small>
          </li>
        ))}
      </ul>
    </>
  );
}

function VisitsTab({ appointments }: { appointments: Appointment[] }): JSX.Element {
  return (
    <>
      <h2>Visits</h2>
      <table className="foo-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Type</th>
            <th>Last Updated</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr>
              <td>
                <CodeableConceptDisplay value={appointment.serviceCategory?.[0] as CodeableConcept} />
              </td>
              <td>
                <CodeableConceptDisplay value={appointment.serviceType?.[0] as CodeableConcept} />
              </td>
              <td>{formatDateTime(appointment.meta?.lastUpdated)}</td>
              <td>
                <StatusBadge status={appointment.status as string} />
              </td>
            </tr>
          ))}
          {appointments.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', fontStyle: 'italic' }}>
                No appointments found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

function LabAndImagingTab({
  patient,
  orders,
  resource,
}: {
  patient: Patient;
  orders: ServiceRequest[];
  resource: Resource | undefined;
}): JSX.Element {
  if (resource) {
    if (resource.resourceType === 'DiagnosticReport') {
      if (resource.presentedForm) {
        return (
          <>
            <h2>Labs &amp; Imaging</h2>
            <iframe src={resource.presentedForm[0].url} width="850" height="600"></iframe>
            <hr />
            <Button size="lg">Approve</Button>
          </>
        );
      }
      return <DiagnosticReportDisplay value={resource} />;
    }
    if (resource.resourceType === 'ImagingStudy') {
      return (
        <>
          <h2>Labs &amp; Imaging</h2>
          <Button>Open in DICOM Viewer...</Button>
          <Button>View study details...</Button>
          <hr />
          <img src="/knee-mri.png" />
          <hr />
          <Button size="lg">Approve</Button>
        </>
      );
    }
    return (
      <>
        <h2>{getPropertyDisplayName(resource.resourceType)}</h2>
        <ResourceTable ignoreMissingValues={true} value={resource} />
        <hr style={{ margin: '20px 0' }} />
        <Button size="lg">Approve</Button>
      </>
    );
  }
  const activeOrders = orders.filter((order) => order.status !== 'completed');
  const completedOrders = orders.filter((order) => order.status === 'completed');
  return (
    <>
      <h2>Labs &amp; Imaging</h2>
      <br />
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
        <MedplumLink className="medplum-button" to={`/Questionnaire/e8f6fb62-ad9f-4351-a0f6-108e839ed89c`}>
          Order
        </MedplumLink>
      </div>
      <h3>Active</h3>
      <table className="foo-table">
        <thead>
          <tr>
            <th style={{ width: '20%' }}>Category</th>
            <th style={{ width: '30%' }}>Code</th>
            <th style={{ width: '25%' }}>Last Updated</th>
            <th style={{ width: '15%' }}>Status</th>
            <th style={{ width: '10%' }} />
          </tr>
        </thead>
        <tbody>
          {activeOrders.map((order) => (
            <tr>
              <td>
                <CodeableConceptDisplay value={order.category?.[0] as CodeableConcept} />
              </td>
              <td>
                <CodeableConceptDisplay value={order.code as CodeableConcept} />
              </td>
              <td>{formatDateTime(order.meta?.lastUpdated)}</td>
              <td>
                <StatusBadge status={order.status as string} />
              </td>
              <td>
                <MedplumLink className="medplum-button" to={`/Patient/${patient.id}/${order.resourceType}/${order.id}`}>
                  Review
                </MedplumLink>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', fontStyle: 'italic' }}>
                No orders found
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <br />
      <br />
      <h3>Completed</h3>
      <table className="foo-table">
        <thead>
          <tr>
            <th style={{ width: '20%' }}>Category</th>
            <th style={{ width: '30%' }}>Code</th>
            <th style={{ width: '25%' }}>Last Updated</th>
            <th style={{ width: '15%' }}>Status</th>
            <th style={{ width: '10%' }} />
          </tr>
        </thead>
        <tbody>
          {completedOrders.map((order) => (
            <tr key={order.id}>
              <td>
                <CodeableConceptDisplay value={order.category?.[0] as CodeableConcept} />
              </td>
              <td>
                <CodeableConceptDisplay value={order.code as CodeableConcept} />
              </td>
              <td>{formatDateTime(order.meta?.lastUpdated)}</td>
              <td>
                <StatusBadge status={order.status as string} />
              </td>
              <td>
                <MedplumLink className="medplum-button" to={`/Patient/${patient.id}/${order.resourceType}/${order.id}`}>
                  Review
                </MedplumLink>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', fontStyle: 'italic' }}>
                No orders found
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <br />
    </>
  );
}

function MedicationTab({ patient }: { patient: Patient }): JSX.Element {
  return (
    <>
      <h2>Medication</h2>
      <br />
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
        <MedplumLink className="medplum-button" to={`/Questionnaire/84c9ca25-a770-462a-9479-12e168627d91`}>
          Order
        </MedplumLink>
      </div>
      <h3>Active</h3>
      <table className="foo-table">
        <thead>
          <tr>
            <th style={{ width: '20%' }}>Category</th>
            <th style={{ width: '30%' }}>Code</th>
            <th style={{ width: '25%' }}>Last Updated</th>
            <th style={{ width: '15%' }}>Status</th>
            <th style={{ width: '10%' }} />
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <br />
    </>
  );
}

function CarePlansTab({ requestGroups }: { requestGroups: RequestGroup[] }): JSX.Element {
  return (
    <>
      <br />
      <h2>Care Plans</h2>
      {requestGroups.map((requestGroup) => (
        <>
          <h3 key={requestGroup.id}>{requestGroup.code?.text}</h3>
          <RequestGroupDisplay
            value={requestGroup}
            onStart={() => console.log('Start task')}
            onEdit={() => console.log('Edit task')}
          />
        </>
      ))}
      <br />
      <br />
    </>
  );
}

function FormsTab(): JSX.Element {
  return (
    <>
      <h2>Forms</h2>
      <ul>
        <li>Questionnaire</li>
        <li>QuestionnaireResponse</li>
      </ul>
    </>
  );
}

function ClinicalNotesTab({ clinicalNotes }: { clinicalNotes: DocumentReference[] }): JSX.Element {
  return (
    <Accordion>
      {clinicalNotes.map((note) => (
        <Accordion.Item value={note.id || ''} key={note.id}>
          <Accordion.Control>
            <ClinicalNoteLabel note={note} />
          </Accordion.Control>
          <Accordion.Panel>
            <ClinicalNotePanel note={note} />
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

function ClinicalNoteLabel({ note }: { note: DocumentReference }): JSX.Element {
  return (
    <Group noWrap>
      <div>
        <Text>{note.description}</Text>
        <Text size="sm" color="dimmed" weight={400}>
          {note.type?.text || ''}
        </Text>
      </div>
    </Group>
  );
}

function ClinicalNotePanel({ note }: { note: DocumentReference }): JSX.Element {
  const [content, setContent] = useState<string>(
    'Labore et dolore magna aliqua. Orci phasellus egestas tellus rutrum tellus pellentesque eu.'
  );
  const medplum = useMedplum();
  useEffect(() => {
    const url = note.content?.[0]?.attachment?.url;
    url &&
      medplum
        .download(url)
        .then((blob) => blob.text())
        .then(setContent);
  }, [medplum, note]);
  return <>{content}</>;
}

function resolveTab(input: string): string {
  if (!input) {
    return 'overview';
  }
  if (input === 'Appointment') {
    return 'visits';
  }
  if (input === 'DiagnosticReport' || input === 'ImagingStudy' || input === 'ServiceRequest') {
    return 'labreports';
  }
  if (input === 'CarePlan' || input === 'RequestGroup') {
    return 'careplans';
  }
  if (input === 'Questionnaire' || input === 'QuestionnaireResponse') {
    return 'forms';
  }
  if (input === 'DocumentReference' || input === 'Media') {
    return 'clinicalnotes';
  }
  return input;
}
