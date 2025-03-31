import { SelectSource } from "@/lib/db/schema"
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

async function fetchCsvData(sid: number) {
    const response = await fetch('/api/sources/adapters/csv', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sid }),
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || 'Failed to load CSV data');
    }

    return result.data;
}

const useCsvData = (sid: number) => {
    return useQuery({
        queryKey: ['csvData', sid],
        queryFn: () => fetchCsvData(sid),
        enabled: !!sid,
    });
}

export default function CsvSource({ source }: { source: SelectSource }) {
    const { data: queryResult, isLoading, error } = useCsvData(source.id);
    const data = queryResult?.rows || [];
    const columnHelper = createColumnHelper<Record<string, string>>();
    const columns = data.length > 0
        ? Object.keys(data[0]).map(header =>
            columnHelper.accessor(header, {
                header: header,
                cell: info => info.getValue() || '',
            })
        )
        : [];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-red-500">
                    <h3 className="text-lg font-semibold">Error loading data</h3>
                    <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500">No data available</p>
            </div>
        );
    }

    return (
        <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b">
                {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                            <th
                                key={header.id}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                                onClick={header.column.getToggleSortingHandler()}
                            >
                                <div className="flex items-center">
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                    <span className="ml-1">
                                        {{
                                            asc: '🔼',
                                            desc: '🔽',
                                        }[header.column.getIsSorted() as string] ?? null}
                                    </span>
                                </div>
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 border-b">
                {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map(cell => (
                            <td key={cell.id} className="px-6 py-4 text-sm">
                                {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                )}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}