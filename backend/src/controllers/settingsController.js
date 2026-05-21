const settingsModel = require('../models/settingsModel');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const logoDir = path.join(uploadsDir, 'logo');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

exports.get = (req, res) => {
  res.json(settingsModel.get());
};

exports.update = (req, res) => {
  const settings = settingsModel.update(req.body);
  res.json(settings);
};

exports.status = (req, res) => {
  const s = settingsModel.get();
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

  logo.mv(filepath, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to save logo' });
    settingsModel.update({ logo_path: `/uploads/logo/${filename}` });
    res.json({ logo_path: `/uploads/logo/${filename}` });
  });
};

exports.deleteLogo = (req, res) => {
  const s = settingsModel.get();
  if (s.logo_path) {
    const filepath = path.join(__dirname, '..', '..', s.logo_path);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    settingsModel.update({ logo_path: '' });
  }
  res.json({ logo_path: '' });
};
