import { ScrollArea, Tabs } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { normalizeErrorString } from '@medplum/core';
import { PlanDefinition } from '@medplum/fhirtypes';
import { Document, PlanDefinitionBuilder, ResourceTable, useMedplum } from '@medplum/react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PlanDefinitionApplyForm } from './PlanDefinitionApplyForm';

export function PlanDefinitionPage(): JSX.Element {
  const navigate = useNavigate();
  const { id, tab } = useParams() as {
    id: string;
    tab: string;
  };
  const medplum = useMedplum();
  const planDefinition = medplum.readResource('PlanDefinition', id).read() as PlanDefinition;
  const defaultTab = 'preview';

  function onSubmit(newResource: PlanDefinition): void {
    medplum
      .updateResource(newResource)
      .then(() => showNotification({ color: 'green', message: 'Success' }))
      .catch((err) => showNotification({ color: 'red', message: normalizeErrorString(err) }));
  }

  return (
    <Tabs value={tab || defaultTab} onChange={(newTab) => navigate(`/PlanDefinition/${id}/${newTab}`)}>
      <ScrollArea>
        <div>
          <div>
            <div>
              <strong>Title:</strong> {planDefinition.title}
            </div>
            <div>
              <strong>Publisher:</strong> {planDefinition.publisher}
            </div>
          </div>
        </div>
      </ScrollArea>
      <Tabs.List>
        <Tabs.Tab value="preview">Preview</Tabs.Tab>
        <Tabs.Tab value="editor">Editor</Tabs.Tab>
        <Tabs.Tab value="assign">Assign</Tabs.Tab>
      </Tabs.List>
      <Document>
        <Tabs.Panel value="preview">
          <ResourceTable value={planDefinition} ignoreMissingValues={true} />
        </Tabs.Panel>
        <Tabs.Panel value="editor">
          <h2>Editor</h2>
          <PlanDefinitionBuilder value={planDefinition} onSubmit={onSubmit} />
        </Tabs.Panel>
        <Tabs.Panel value="assign">
          <h2>Assign</h2>
          <PlanDefinitionApplyForm planDefinition={planDefinition} />
        </Tabs.Panel>
      </Document>
    </Tabs>
  );
}
