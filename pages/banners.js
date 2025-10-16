import { useEffect, useMemo, useState } from 'react';
import ModernLayout from '../components/ModernLayout';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { checkSession } from '../lib/simpleAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Banners() {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // banner object or null
  const [limit, setLimit] = useState(3);
  const [savingLimit, setSavingLimit] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  useEffect(() => {
    const session = checkSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchAll();
  }, [router]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: bannersData }, { data: setting }] = await Promise.all([
        supabase
          .from('banners')
          .select('id,image_url,video_url,cta_text,cta_url,cta_align,start_at,end_at,target,duration_ms,overlay_opacity,alt_text,aria_label,active,sort_order,created_at,updated_at')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'home_banner_limit')
          .maybeSingle(),
      ]);
      setBanners(bannersData || []);
      const parsed = Number(setting?.value);
      setLimit(!Number.isNaN(parsed) && parsed > 0 ? parsed : 3);
    } catch (e) {
      console.error('Failed to fetch', e);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  // Drag & Drop reorder with auto-save
  const saveOrder = async (arr) => {
    try {
      await Promise.all(
        arr.map((b, i) => supabase.from('banners').update({ sort_order: i }).eq('id', b.id))
      );
      setBanners(arr);
    } catch (e) {
      console.error(e);
      alert('Save order failed');
    }
  };

  const handleDragStart = (idx) => setDragIndex(idx);
  const handleDragOver = (e, idx) => {
    e.preventDefault();
  };
  const handleDrop = async (e, idx) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return setDragIndex(null);
    const arr = [...banners];
    const [moved] = arr.splice(dragIndex, 1);
    arr.splice(idx, 0, moved);
    setDragIndex(null);
    await saveOrder(arr);
  };

  const upsertBanner = async (banner) => {
    try {
      const clean = {
        image_url: banner.image_url?.trim() || null,
        video_url: banner.video_url?.trim() || null,
        cta_text: banner.cta_text?.trim() || null,
        cta_url: banner.cta_url?.trim() || null,
        cta_align: banner.cta_align || 'center',
        target: banner.target || 'all',
        duration_ms: banner.duration_ms ? Number(banner.duration_ms) : null,
        overlay_opacity: banner.overlay_opacity !== undefined && banner.overlay_opacity !== ''
          ? Math.max(0, Math.min(0.6, Number(banner.overlay_opacity)))
          : null,
        alt_text: banner.alt_text?.trim() || null,
        aria_label: banner.aria_label?.trim() || null,
        start_at: banner.start_at ? new Date(banner.start_at).toISOString() : null,
        end_at: banner.end_at ? new Date(banner.end_at).toISOString() : null,
        active: banner.active ?? true,
        sort_order: banner.sort_order ?? (banners.length ? Math.max(...banners.map(b => b.sort_order || 0)) + 1 : 0),
      };
      if (banner.id) {
        await supabase.from('banners').update(clean).eq('id', banner.id);
      } else {
        await supabase.from('banners').insert([clean]);
      }
      setEditing(null);
      fetchAll();
    } catch (e) {
      alert('Save failed');
      console.error(e);
    }
  };

  const deleteBanner = async (id) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await supabase.from('banners').delete().eq('id', id);
      fetchAll();
    } catch (e) {
      alert('Delete failed');
    }
  };

  const toggleActive = async (b) => {
    try {
      await supabase.from('banners').update({ active: !b.active }).eq('id', b.id);
      fetchAll();
    } catch (e) {
      alert('Update failed');
    }
  };

  const move = async (index, dir) => {
    const a = banners[index];
    const b = banners[index + dir];
    if (!a || !b) return;
    try {
      await Promise.all([
        supabase.from('banners').update({ sort_order: b.sort_order ?? 0 }).eq('id', a.id),
        supabase.from('banners').update({ sort_order: a.sort_order ?? 0 }).eq('id', b.id),
      ]);
      fetchAll();
    } catch (e) {
      alert('Reorder failed');
    }
  };

  const saveLimit = async () => {
    setSavingLimit(true);
    try {
      const value = String(Math.max(1, Number(limit) || 3));
      const { data: row } = await supabase
        .from('site_settings')
        .select('key')
        .eq('key', 'home_banner_limit')
        .maybeSingle();
      if (row) await supabase.from('site_settings').update({ value }).eq('key', 'home_banner_limit');
      else await supabase.from('site_settings').insert([{ key: 'home_banner_limit', value }]);
      alert('Limit saved');
    } catch (e) {
      alert('Failed to save limit');
    } finally {
      setSavingLimit(false);
    }
  };

  const BannerModal = ({ value, onClose, onSave }) => {
    const [form, setForm] = useState({
      id: value?.id || null,
      image_url: value?.image_url || '',
      video_url: value?.video_url || '',
      cta_text: value?.cta_text || '',
      cta_url: value?.cta_url || '',
      cta_align: value?.cta_align || 'center',
      target: value?.target || 'all',
      duration_ms: value?.duration_ms ?? '',
      overlay_opacity: value?.overlay_opacity ?? '',
      alt_text: value?.alt_text || '',
      aria_label: value?.aria_label || '',
      start_at: value?.start_at ? new Date(value.start_at).toISOString().slice(0,16) : '',
      end_at: value?.end_at ? new Date(value.end_at).toISOString().slice(0,16) : '',
      active: value?.active ?? true,
      sort_order: value?.sort_order ?? undefined,
    });

    const uploadToStorage = async (file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'dat';
      const path = `banners/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('banners').getPublicUrl(path);
      return data.publicUrl;
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-bold">{form.id ? 'Edit Banner' : 'New Banner'}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Image URL</label>
              <input value={form.image_url} onChange={(e)=>setForm({ ...form, image_url: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="https://..." />
              <div className="mt-2 flex items-center gap-2">
                <label className="inline-flex items-center px-3 py-2 border rounded cursor-pointer text-sm">
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const url = await uploadToStorage(f);
                      setForm(prev => ({ ...prev, image_url: url }));
                    } catch {
                      alert('Image upload failed');
                    }
                  }} />
                  Upload Image
                </label>
                {form.image_url ? <img src={form.image_url} alt="preview" className="h-10 w-16 object-cover rounded" /> : null}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Video URL</label>
              <input value={form.video_url} onChange={(e)=>setForm({ ...form, video_url: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="https://... (mp4, webm)" />
              <div className="mt-2 flex items-center gap-2">
                <label className="inline-flex items-center px-3 py-2 border rounded cursor-pointer text-sm">
                  <input type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const url = await uploadToStorage(f);
                      setForm(prev => ({ ...prev, video_url: url }));
                    } catch {
                      alert('Video upload failed');
                    }
                  }} />
                  Upload Video
                </label>
                {form.video_url ? (
                  <video src={form.video_url} className="h-10 w-16 rounded object-cover" muted playsInline />
                ) : null}
              </div>
              <p className="text-xs text-gray-500 mt-1">If both image and video are set, video will be shown.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">CTA Text</label>
                <input value={form.cta_text} onChange={(e)=>setForm({ ...form, cta_text: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Chat Now" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">CTA URL</label>
                <input value={form.cta_url} onChange={(e)=>setForm({ ...form, cta_url: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="https://wa.me/+91... or /path" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Start At (optional)</label>
                <input type="datetime-local" value={form.start_at} onChange={(e)=>setForm({ ...form, start_at: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">End At (optional)</label>
                <input type="datetime-local" value={form.end_at} onChange={(e)=>setForm({ ...form, end_at: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Target</label>
                <select value={form.target} onChange={(e)=>setForm({ ...form, target: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2">
                  <option value="all">All</option>
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Duration (ms)</label>
                <input type="number" min={1000} step={100} value={form.duration_ms} onChange={(e)=>setForm({ ...form, duration_ms: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="4000" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Overlay Opacity (0–0.6)</label>
                <input type="number" min={0} max={0.6} step={0.05} value={form.overlay_opacity} onChange={(e)=>setForm({ ...form, overlay_opacity: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="0.1" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Alt Text (for image)</label>
                <input value={form.alt_text} onChange={(e)=>setForm({ ...form, alt_text: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Banner description" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">CTA Aria Label</label>
                <input value={form.aria_label} onChange={(e)=>setForm({ ...form, aria_label: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Open WhatsApp" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">CTA Align</label>
                <select value={form.cta_align} onChange={(e)=>setForm({ ...form, cta_align: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2">
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Active</label>
                <select value={form.active ? 'true' : 'false'} onChange={(e)=>setForm({ ...form, active: e.target.value === 'true' })} className="mt-1 w-full border rounded-lg px-3 py-2">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Sort Order (optional)</label>
                <input type="number" value={form.sort_order ?? ''} onChange={(e)=>setForm({ ...form, sort_order: e.target.value ? Number(e.target.value) : undefined })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Auto" />
              </div>
            </div>
            <div className="text-right">
              <button onClick={() => onSave(form)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ModernLayout user={{ email: 'admin@taliyo.com' }}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Banners</h1>
            <p className="text-gray-600 mt-1">Manage homepage slider banners</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setEditing({})} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">New Banner</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Home Banner Limit</label>
            <input type="number" min={1} value={limit} onChange={(e)=>setLimit(Number(e.target.value))} className="w-24 border rounded px-3 py-2" />
            <button onClick={saveLimit} disabled={savingLimit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60">{savingLimit ? 'Saving...' : 'Save'}</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading...</div>
          ) : banners.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No banners yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Preview</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">CTA</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Align</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Active</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {banners.map((b, idx) => (
                    <tr
                      key={b.id}
                      className={`transition-colors ${dragIndex === idx ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                    >
                      <td className="px-6 py-3 whitespace-nowrap">
                        {b.video_url ? (
                          <video src={b.video_url} className="w-40 h-16 rounded object-cover" muted playsInline />
                        ) : b.image_url ? (
                          <img src={b.image_url} className="w-40 h-16 object-cover rounded" alt="banner" />
                        ) : (
                          <span className="text-xs text-gray-400">No media</span>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{b.cta_text || '-'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[240px]">{b.cta_url || '-'}</div>
                        {(b.start_at || b.end_at) && (
                          <div className="text-[11px] text-gray-500 mt-1">
                            {b.start_at ? `From: ${new Date(b.start_at).toLocaleString()}` : ''}
                            {b.end_at ? `  To: ${new Date(b.end_at).toLocaleString()}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">{b.cta_align || 'center'}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <button onClick={() => toggleActive(b)} className={`px-3 py-1 rounded ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{b.active ? 'Active' : 'Inactive'}</button>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button disabled={idx===0} onClick={() => move(idx, -1)} className="px-2 py-1 border rounded disabled:opacity-50">↑</button>
                          <button disabled={idx===banners.length-1} onClick={() => move(idx, 1)} className="px-2 py-1 border rounded disabled:opacity-50">↓</button>
                          <span className="text-xs text-gray-500 ml-2">{b.sort_order ?? idx}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditing(b)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded">Edit</button>
                          <button onClick={() => deleteBanner(b.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editing && (
          <BannerModal
            value={editing}
            onClose={() => setEditing(null)}
            onSave={upsertBanner}
          />
        )}
      </div>
    </ModernLayout>
  );
}
