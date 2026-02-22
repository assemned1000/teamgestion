import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportClientData {
  clientName: string;
  managerName: string;
  contactPerson?: string;
  enterpriseName: string;
  employees: {
    name: string;
    position: string;
    rate: number;
    isProrated: boolean;
  }[];
  additionalCosts: {
    description: string;
    amount: number;
  }[];
  totalRevenue: number;
}

export const generateClientExportHTML = (data: ExportClientData): string => {
  const isOmpleo = data.enterpriseName.toLowerCase().includes('ompleo');
  const isScalset = data.enterpriseName.toLowerCase().includes('scalset');

  const employeesRows = data.employees
    .map(
      (emp) => {
        if (isOmpleo) {
          return `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #d1d5db; color: #111827;">${emp.position}</td>
              <td style="padding: 12px; border-bottom: 1px solid #d1d5db; text-align: right; color: #111827;">${emp.rate.toLocaleString()} EUR</td>
            </tr>
          `;
        } else if (isScalset) {
          return `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #d1d5db; color: #111827;">${emp.position}</td>
              <td style="padding: 12px; border-bottom: 1px solid #d1d5db; text-align: right; color: #111827;">${emp.rate.toLocaleString()} EUR</td>
            </tr>
          `;
        } else {
          return `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #d1d5db; color: #111827;">${emp.name}</td>
              <td style="padding: 12px; border-bottom: 1px solid #d1d5db; color: #111827;">${emp.position}</td>
              <td style="padding: 12px; border-bottom: 1px solid #d1d5db; text-align: center; color: #111827;">${emp.isProrated ? 'Prorata' : ''}</td>
              <td style="padding: 12px; border-bottom: 1px solid #d1d5db; text-align: right; color: #111827;">${emp.rate.toLocaleString()} EUR</td>
            </tr>
          `;
        }
      }
    )
    .join('');

  const additionalCostsRows = data.additionalCosts
    .map(
      (cost) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #d1d5db; color: #111827;">${cost.description}</td>
          <td style="padding: 12px; border-bottom: 1px solid #d1d5db; text-align: right; color: #111827;">${cost.amount.toLocaleString()} EUR</td>
        </tr>
      `
    )
    .join('');

  const tableTitle = isOmpleo ? 'Offres d\'emploi' : isScalset ? 'Services' : 'Coûts des Employés';
  const firstColumnHeader = isOmpleo ? 'Offre d\'emploi' : isScalset ? 'Service' : 'Employé';

  const tableHeaders = isOmpleo || isScalset
    ? `
      <tr style="background: #000000;">
        <th style="padding: 12px; text-align: left; color: #ffffff; font-weight: 600;">${firstColumnHeader}</th>
        <th style="padding: 12px; text-align: right; color: #ffffff; font-weight: 600;">Prix</th>
      </tr>
    `
    : `
      <tr style="background: #000000;">
        <th style="padding: 12px; text-align: left; color: #ffffff; font-weight: 600;">Employé</th>
        <th style="padding: 12px; text-align: left; color: #ffffff; font-weight: 600;">Poste</th>
        <th style="padding: 12px; text-align: center; color: #ffffff; font-weight: 600;">Remarque</th>
        <th style="padding: 12px; text-align: right; color: #ffffff; font-weight: 600;">Tarif Mensuel</th>
      </tr>
    `;

  return `
    <div style="font-family: Arial, sans-serif; padding: 40px; background: white; width: 800px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #000000; margin: 0 0 10px 0; font-size: 32px;">Détails du Client</h1>
        <h2 style="color: #1f2937; margin: 0; font-size: 24px;">${data.clientName}</h2>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #111827; font-size: 18px; margin-bottom: 15px;">${tableTitle}</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden;">
          <thead>
            ${tableHeaders}
          </thead>
          <tbody>
            ${employeesRows}
          </tbody>
        </table>
      </div>

      ${
        data.additionalCosts.length > 0
          ? `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #111827; font-size: 18px; margin-bottom: 15px;">Coûts Additionnels</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #000000;">
              <th style="padding: 12px; text-align: left; color: #ffffff; font-weight: 600;">Description</th>
              <th style="padding: 12px; text-align: right; color: #ffffff; font-weight: 600;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${additionalCostsRows}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      <div style="margin-top: 40px; padding: 20px; background: #000000; border-radius: 8px; text-align: right;">
        <p style="margin: 0 0 5px 0; color: #9ca3af; font-size: 14px;">TOTAL MENSUEL</p>
        <p style="margin: 0; color: white; font-weight: bold; font-size: 32px;">${data.totalRevenue.toLocaleString()} EUR</p>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #d1d5db; text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">Document généré le ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  `;
};

export const exportClientAsPDF = async (data: ExportClientData) => {
  const container = document.createElement('div');
  container.innerHTML = generateClientExportHTML(data);
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${data.clientName.replace(/[^a-z0-9]/gi, '_')}_details.pdf`);
  } finally {
    document.body.removeChild(container);
  }
};

export const exportClientAsImage = async (data: ExportClientData) => {
  const container = document.createElement('div');
  container.innerHTML = generateClientExportHTML(data);
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${data.clientName.replace(/[^a-z0-9]/gi, '_')}_details.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  } finally {
    document.body.removeChild(container);
  }
};
