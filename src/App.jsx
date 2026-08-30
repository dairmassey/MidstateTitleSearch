import {useEffect, useMemo, useState} from 'react';
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutHeader,
  StackItem,
  VStack,
} from '@astryxdesign/core/Layout';
import {Heading, Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Button} from '@astryxdesign/core/Button';
import {Banner} from '@astryxdesign/core/Banner';
import {Badge} from '@astryxdesign/core/Badge';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Table, proportional} from '@astryxdesign/core/Table';
import {useAnnounce} from '@astryxdesign/core/hooks';
import csvUrl from '../examinees_all.csv?url';
import {
  formatDate,
  hasExactName,
  parseCSV,
  searchRecords,
} from './csv.js';

const columns = [
  {
    key: 'name',
    header: 'Name',
    width: proportional(2),
    renderCell: record => <Text weight="semibold">{record.name}</Text>,
  },
  {
    key: 'address',
    header: 'Address',
    width: proportional(3),
    renderCell: record => <Text>{record.address || '—'}</Text>,
  },
  {
    key: 'county',
    header: 'County',
    width: proportional(1),
  },
  {
    key: 'invoice_number',
    header: 'Invoice',
    width: proportional(1),
    renderCell: record => (
      <Text type="code" hasTabularNumbers>
        {record.invoice_number || '—'}
      </Text>
    ),
  },
  {
    key: 'date',
    header: 'Date',
    width: proportional(1),
    renderCell: record => (
      <Text hasTabularNumbers>{formatDate(record.date)}</Text>
    ),
  },
];

export function App() {
  const initialQuery = new URLSearchParams(window.location.search).get('q') || '';
  const [records, setRecords] = useState([]);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery.trim());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const announce = useAnnounce();

  useEffect(() => {
    async function loadRecords() {
      try {
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error(`CSV request failed: ${response.status}`);
        setRecords(parseCSV(await response.text()));
      } catch (loadError) {
        console.error(loadError);
        setError('The title record file could not be loaded.');
      } finally {
        setIsLoading(false);
      }
    }

    loadRecords();
  }, []);

  const matches = useMemo(
    () => searchRecords(records, query),
    [records, query],
  );
  const exactMatch = useMemo(
    () => hasExactName(records, query),
    [records, query],
  );
  useEffect(() => {
    if (!query || isLoading || error) return;
    announce(
      `${matches.length} ${matches.length === 1 ? 'record' : 'records'} found.`,
    );
  }, [announce, error, isLoading, matches.length, query]);

  function submitSearch() {
    const nextQuery = inputValue.trim();
    setQuery(nextQuery);

    const url = new URL(window.location.href);
    if (nextQuery) url.searchParams.set('q', nextQuery);
    else url.searchParams.delete('q');
    window.history.replaceState(null, '', url);
  }

  function clearSearch() {
    setInputValue('');
    setQuery('');
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    window.history.replaceState(null, '', url);
  }

  function handleInputChange(value) {
    setInputValue(value);
    if (!value) clearSearch();
  }

  return (
    <Layout
      height="fill"
      contentWidth={1200}
      defaultHasDividers
      header={
        <LayoutHeader label="Midstate Title header">
          <HStack gap={3} vAlign="center" wrap="wrap">
            <Heading level={1}>Midstate Title</Heading>
            <Text type="supporting">Title record search</Text>
            <StackItem size="fill" />
            <Text type="supporting" hasTabularNumbers>
              {isLoading ? 'Loading records…' : `${records.length} records`}
            </Text>
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={4} label="Title records">
          <VStack gap={6}>
            <VStack gap={1}>
              <Heading level={2}>Search title records</Heading>
              <Text color="secondary">
                Look up a name or search by address, county, invoice number, or date.
              </Text>
            </VStack>

            <HStack gap={2} vAlign="end" wrap="wrap">
              <StackItem size="fill">
                <TextInput
                  label="Name or record detail"
                  value={inputValue}
                  onChange={handleInputChange}
                  onEnter={submitSearch}
                  placeholder="Example: Georgia College or 2018-220"
                  hasClear
                  size="lg"
                  width="100%"
                  isLoading={isLoading}
                  isDisabled={Boolean(error)}
                  disabledMessage={error || undefined}
                />
              </StackItem>
              <Button
                label="Search"
                variant="primary"
                size="lg"
                onClick={submitSearch}
                isDisabled={!inputValue.trim() || isLoading || Boolean(error)}
              />
            </HStack>

            {error ? (
              <Banner
                status="error"
                title="Records unavailable"
                description={error}
              />
            ) : null}

            {query && exactMatch && !isLoading && !error ? (
              <Banner
                status="warning"
                title="Exact name found in the title file"
                description={`At least one record uses “${query}”. Review the matching metadata below.`}
              />
            ) : null}

            {!query && !error ? (
              <EmptyState
                title="Search the title file"
                description="Enter a name or another record detail to check the 195 published records."
                headingLevel={2}
              />
            ) : null}

            {query && !isLoading && !error ? (
              <VStack gap={3}>
                <HStack gap={2} vAlign="center">
                  <Heading level={2}>Search results</Heading>
                  <Badge label={matches.length} variant="neutral" />
                </HStack>

                {matches.length ? (
                  <VStack gap={3}>
                    <Table
                      data={matches}
                      columns={columns}
                      idKey="id"
                      density="compact"
                      dividers="rows"
                      hasHover
                      textOverflow="wrap"
                      rowIndexStart={1}
                      rowCount={matches.length}
                    />
                  </VStack>
                ) : (
                  <EmptyState
                    title="No similar records"
                    description="Try a shorter name, a county, an address, or an invoice number."
                    actions={
                      <Button
                        label="Clear search"
                        variant="secondary"
                        onClick={clearSearch}
                      />
                    }
                    headingLevel={3}
                  />
                )}
              </VStack>
            ) : null}

            <Text type="supporting" color="secondary">
              Results only reflect the published CSV and are not a legal determination of title availability.
            </Text>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
