const fs = require('fs');

const files = [
  'app/staff/scan/page.tsx',
  'app/staff/customers/page.tsx',
  'app/staff/reviews/page.tsx',
  'app/staff/dashboard/page.tsx',
  'app/portal/invoices/page.tsx',
  'app/admin/vehicles/[id]/page.tsx',
  'app/admin/parts/page.tsx',
  'app/admin/payouts/page.tsx',
  'app/admin/invoices/[id]/page.tsx',
  'app/admin/customers/page.tsx',
  'app/admin/staff/page.tsx',
];

for (const f of files) {
  try {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;

    // Add import if needed
    if (!content.includes("import { Loader } from '@/components/ui/Loader'")) {
      content = content.replace(/(import .*?\n)(?=(?:import|\n))/, `$1import { Loader } from '@/components/ui/Loader';\n`);
      changed = true;
    }

    const initialContent = content;

    // staff/scan, staff/customers, staff/reviews
    content = content.replace(/<div className="flex justify-center py-12".*?<Loader2.*?size=\{36\}.*?\/>.*?<\/div>/g, '<Loader />');
    // staff/dashboard
    content = content.replace(/if \(loading\) return <div className="flex p-12 justify-center"><Loader2 size=\{48\} className="animate-spin text-electricYellow" \/><\/div>;/g, 'if (loading) return <Loader fullScreen />;');
    // portal/invoices, admin/invoices
    content = content.replace(/if \(loading\) return <div className="p-12 text-center flex justify-center"><Loader2 className="animate-spin text-electricYellow" size=\{32\} \/><\/div>;/g, 'if (loading) return <Loader fullScreen />;');
    // admin/vehicles (type 1)
    content = content.replace(/if \(loading\) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-electricYellow" size=\{32\} \/><\/div>;/g, 'if (loading) return <Loader fullScreen />;');
    // admin/vehicles (type 2 - image loading)
    content = content.replace(/<div className="w-40 h-40 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" \/><\/div>/g, '<Loader />');
    // admin/parts
    content = content.replace(/<div className="col-span-full py-12 flex justify-center"><Loader2 className="animate-spin text-electricYellow" size=\{48\}\/><\/div>/g, '<div className="col-span-full"><Loader /></div>');
    // admin/payouts
    content = content.replace(/if \(loading && staffList\.length === 0\) return <div className="p-12 text-center"><Loader2 className="animate-spin text-electricYellow mx-auto" \/><\/div>;/g, 'if (loading && staffList.length === 0) return <Loader fullScreen />;');
    // admin/customers
    content = content.replace(/<tr><td colSpan=\{6\} className="p-8 text-center font-bold text-gray-500 uppercase tracking-widest"><Loader2 className="animate-spin mx-auto mb-2" \/> Loading...<\/td><\/tr>/g, '<tr><td colSpan={6} className="p-8"><Loader text="Loading Customers..." /></td></tr>');
    // admin/staff
    content = content.replace(/<Loader2 size=\{40\} className="animate-spin text-electricYellow" \/>/g, '<Loader />');
    
    if (content !== initialContent || changed) {
      fs.writeFileSync(f, content);
      console.log(`Updated ${f}`);
    }
  } catch (err) {
    console.error(`Skipping ${f} due to error:`, err.message);
  }
}
