const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  try {
    const invoice = await prisma.invoice.findFirst({
      select: { id: true, invoiceNumber: true }
    });
    if (invoice) {
    } else {
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
})();
