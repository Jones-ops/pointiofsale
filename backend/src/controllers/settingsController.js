const settingsModel = require('../models/settingsModel');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const logoDir = path.join(uploadsDir, 'logo');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

exports.get = async (req, res) => {
  res.json(await settingsModel.get());
};

exports.update = async (req, res) => {
  const settings = await settingsModel.update(req.body);
  res.json(settings);
};

exports.status = async (req, res) => {
  const s = await settingsModel.get();
  const complete = s.setup_complete === 1 && s.company_name !== 'My Company';
  res.json({ setup_complete: !!complete });
};

exports.uploadLogo = (req, res) => {
  if (!req.files || !req.files.logo) {
    return res.status(400).json({ error: 'No logo file provided' });
  }
  const logo = req.files.logo;
  const ext = path.extname(logo.name) || '.png';
  const filename = `logo${ext}`;
  const filepath = path.join(logoDir, filename);

  logo.mv(filepath, async (err) => {
    if (err) return res.status(500).json({ error: 'Failed to save logo' });
    await settingsModel.update({ logo_path: `/uploads/logo/${filename}` });
    res.json({ logo_path: `/uploads/logo/${filename}` });
  });
};

exports.deleteLogo = async (req, res) => {
  const s = await settingsModel.get();
  if (s.logo_path) {
    const filepath = path.join(__dirname, '..', '..', s.logo_path);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    await settingsModel.update({ logo_path: '' });
  }
  res.json({ logo_path: '' });
};
