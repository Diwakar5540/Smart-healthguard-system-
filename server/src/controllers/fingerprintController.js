import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const lookupByFingerprint = async (req, res) => {
  try {
    const { fingerprintId } = req.body;

    if (!fingerprintId) {
      return res.status(400).json({ error: 'Fingerprint ID required' });
    }

    // --- DEMO MODE BYPASS ---
    if (fingerprintId === 'demo-fingerprint-id-123') {
      return res.status(200).json({
        found: true,
        name: "Mock Patient (Demo Profile)",
        bloodGroup: "O+",
        registeredSince: new Date().toISOString(),
        message: 'Demo health record retrieved via simulation'
      });
    }

    const user = await prisma.user.findFirst({
      where: { fingerprintId: fingerprintId },
      select: {
        id: true,
        name: true,
        bloodGroup: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'No health record linked to this fingerprint' });
    }

    return res.status(200).json({
      found: true,
      name: user.name,
      bloodGroup: user.bloodGroup || 'Not set',
      registeredSince: user.createdAt,
      message: 'Blood group retrieved successfully via fingerprint'
    });

  } catch (error) {
    console.error('Lookup Error:', error);
    return res.status(500).json({ error: 'Lookup failed' });
  }
};
