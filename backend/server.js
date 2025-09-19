'use strict';

const express = require('express');
const cors = require('cors');
// Polyfill fetch/Headers for older Node (<=18)
try {
  if (typeof global.fetch === 'undefined') {
    const { fetch, Headers, Request, Response } = require('undici');
    Object.assign(global, { fetch, Headers, Request, Response });
  }
} catch (_) {}

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for Supabase operations
async function getAllSets() {
  try {
    const { data, error } = await supabase
      .from('word_sets')
      .select('name, words, updated_at')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    const result = {};
    data.forEach(set => {
      result[set.name] = set.words;
    });
    return result;
  } catch (error) {
    console.error('Error fetching sets:', error);
    return {};
  }
}

async function getSetByName(name) {
  try {
    const { data, error } = await supabase
      .from('word_sets')
      .select('words')
      .eq('name', name)
      .single();
    
    if (error) throw error;
    return data ? data.words : null;
  } catch (error) {
    console.error('Error fetching set:', error);
    return null;
  }
}

async function saveSet(name, words) {
  try {
    const { error } = await supabase
      .from('word_sets')
      .upsert({
        name,
        words,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving set:', error);
    return false;
  }
}

async function deleteSet(name) {
  try {
    const { error } = await supabase
      .from('word_sets')
      .delete()
      .eq('name', name);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting set:', error);
    return false;
  }
}

// List all set names
app.get('/api/sets', async (req, res) => {
  try {
    const all = await getAllSets();
    res.json({ names: Object.keys(all) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sets' });
  }
});

// Get a set by name
app.get('/api/sets/:name', async (req, res) => {
  try {
    const words = await getSetByName(req.params.name);
    if (!words) return res.status(404).json({ error: 'Not found' });
    res.json({ name: req.params.name, words });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch set' });
  }
});

// Create or update a set
app.post('/api/sets/:name', async (req, res) => {
  const name = req.params.name.trim();
  const words = req.body && Array.isArray(req.body.words) ? req.body.words : null;
  if (!name) return res.status(400).json({ error: 'Name required' });
  if (!words) return res.status(400).json({ error: 'Body.words must be an array' });

  const valid = words.filter(w => w && typeof w.hint === 'string' && typeof w.answer === 'string');
  
  try {
    const success = await saveSet(name, valid);
    if (!success) return res.status(500).json({ error: 'Failed to save set' });
    res.json({ ok: true, count: valid.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save set' });
  }
});

// Delete a set
app.delete('/api/sets/:name', async (req, res) => {
  try {
    const success = await deleteSet(req.params.name);
    if (!success) return res.status(500).json({ error: 'Failed to delete set' });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete set' });
  }
});

app.listen(PORT, () => {
  console.log(`Word sets API listening on http://localhost:${PORT}`);
});


