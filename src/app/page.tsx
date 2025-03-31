'use client';

import { useQuery } from '@tanstack/react-query';

type StatusResponse = {
  success: boolean;
  message: string;
  error?: string;
};

async function checkDbStatus(): Promise<StatusResponse> {
  const response = await fetch('/api/db-status');
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response.json();
}

async function checkS3Status(): Promise<StatusResponse> {
  const response = await fetch('/api/s3/status');
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response.json();
}

async function checkMemgraphStatus(): Promise<StatusResponse> {
  const response = await fetch('/api/memgraph/status');
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response.json();
}

function StatusCard({ title, data, isLoading, isError, error }: {
  title: string;
  data?: StatusResponse;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}) {
  if (isLoading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="font-bold mb-2">{title}</h2>
        <p>Checking connection...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        <h2 className="font-bold mb-2">{title}</h2>
        <p>Error checking connection: {error?.message || 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${data?.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      <h2 className="font-bold mb-2">{title}</h2>
      <p className="font-medium">{data?.message}</p>
      {data?.error && <p className="mt-2 text-sm">{data.error}</p>}
    </div>
  );
}

export default function Home() {
  const dbQuery = useQuery({
    queryKey: ['dbStatus'],
    queryFn: checkDbStatus,
  });

  const s3Query = useQuery({
    queryKey: ['s3Status'],
    queryFn: checkS3Status,
  });

  const memgraphQuery = useQuery({
    queryKey: ['memgraphStatus'],
    queryFn: checkMemgraphStatus,
  });

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <StatusCard
          title="Database Status"
          data={dbQuery.data}
          isLoading={dbQuery.isLoading}
          isError={dbQuery.isError}
          error={dbQuery.error instanceof Error ? dbQuery.error : null}
        />
        <StatusCard
          title="S3 Storage Status"
          data={s3Query.data}
          isLoading={s3Query.isLoading}
          isError={s3Query.isError}
          error={s3Query.error instanceof Error ? s3Query.error : null}
        />
        <StatusCard
          title="Memgraph Status"
          data={memgraphQuery.data}
          isLoading={memgraphQuery.isLoading}
          isError={memgraphQuery.isError}
          error={memgraphQuery.error instanceof Error ? memgraphQuery.error : null}
        />
      </div>
    </div>
  );
}
