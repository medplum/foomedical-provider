import { Paper, ScrollArea, Tabs } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { formatDateTime, normalizeErrorString } from '@medplum/core';
import { Questionnaire } from '@medplum/fhirtypes';
import { Document, QuestionnaireBuilder, QuestionnaireForm, useMedplum } from '@medplum/react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function QuestionnairePage(): JSX.Element {
  const navigate = useNavigate();
  const { id, tab } = useParams() as {
    id: string;
    tab: string;
  };
  const medplum = useMedplum();
  const questionnaire = medplum.readResource('Questionnaire', id).read() as Questionnaire;
  const defaultTab = 'preview';

  function onSubmit(newResource: Questionnaire): void {
    medplum
      .updateResource(newResource)
      .then(() => showNotification({ color: 'green', message: 'Success' }))
      .catch((err) => showNotification({ color: 'red', message: normalizeErrorString(err) }));
  }

  return (
    <Tabs value={tab || defaultTab} onTabChange={(newTab) => navigate(`/Questionnaire/${id}/${newTab}`)}>
      <Paper>
        <ScrollArea>
          <div>
            <div>
              <div>
                <strong>Title:</strong> {questionnaire.title}
              </div>
              <div>
                <strong>Publisher:</strong> {questionnaire.publisher}
              </div>
              <div>
                <strong>Last Updated:</strong> {formatDateTime(questionnaire.meta?.lastUpdated)}
              </div>
            </div>
          </div>
        </ScrollArea>
        <Tabs.List>
          <Tabs.Tab value="preview">Preview</Tabs.Tab>
          <Tabs.Tab value="editor">Editor</Tabs.Tab>
        </Tabs.List>
      </Paper>
      <Document>
        <Tabs.Panel value="preview">
          <QuestionnaireForm
            key={questionnaire.id}
            questionnaire={questionnaire}
            onSubmit={() => alert('You submitted the preview')}
          />
        </Tabs.Panel>
        <Tabs.Panel value="editor">
          <h2>Editor</h2>
          <QuestionnaireBuilder key={questionnaire.id} questionnaire={questionnaire} onSubmit={onSubmit} />
        </Tabs.Panel>
      </Document>
    </Tabs>
  );
}
