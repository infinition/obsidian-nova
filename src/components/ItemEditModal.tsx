import React, { useEffect, useState } from 'react';
import {
  X, Check, Globe, Trash2, Palette,
  // Popular Lucide icons for selection
  Home, Star, Heart, Settings, User, Mail, Phone, Camera, Image, Video,
  Music, Play, Pause, Volume2, Mic, Download, Upload, Cloud, Folder, File,
  FileText, Calendar, Clock, Bell, Search, Filter, Edit, Pencil, Trash,
  Plus, Minus, Check as CheckIcon, X as XIcon, ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Menu, MoreHorizontal, MoreVertical,
  Link, ExternalLink, Share, Send, MessageCircle, MessageSquare, Bookmark,
  Tag, Flag, Award, Zap, Sparkles, Sun, Moon, CloudRain, Snowflake,
  Compass, Map, MapPin, Navigation, Globe2, Plane, Car, Train, Bike,
  Coffee, Pizza, Apple, Leaf, Flower2, Trees, Mountain, Waves,
  Book, BookOpen, GraduationCap, Briefcase, Building, Building2, Store,
  ShoppingCart, ShoppingBag, CreditCard, Wallet, DollarSign, PiggyBank,
  Gift, PartyPopper, Cake, Gamepad2, Dice5, Puzzle, Trophy, Target,
  Flame, Lightbulb, Battery, Power, Wifi, Bluetooth, Radio, Tv, Monitor,
  Laptop, Tablet, Smartphone, Watch, Headphones, Speaker, Keyboard, Mouse,
  Printer, ScanLine, Cpu, HardDrive, Database, Server, Code, Terminal,
  Bug, Shield, Lock, Unlock, Key, Eye, EyeOff, Fingerprint,
  Users, UserPlus, UserMinus, UserCheck, Contact, BadgeCheck,
  Github, Twitter, Facebook, Instagram, Linkedin, Youtube, Twitch,
  Chrome, Slack, Figma, Framer,
  Rocket, Satellite, Atom, Beaker, Dna, Pill, Stethoscope,
  Hammer, Wrench, Ruler, Scissors, Brush, PaintBucket,
  Eraser, Pipette, Wand2, Layers, Layout, Grid, List, Table,
  BarChart, PieChart, LineChart, TrendingUp, TrendingDown, Activity
} from 'lucide-react';
import type { WebOSAppItem, WebOSItem } from '../types';

// Map of available Lucide icons
const LUCIDE_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  home: Home, star: Star, heart: Heart, settings: Settings, user: User,
  mail: Mail, phone: Phone, camera: Camera, image: Image, video: Video,
  music: Music, play: Play, pause: Pause, volume2: Volume2, mic: Mic,
  download: Download, upload: Upload, cloud: Cloud, folder: Folder, file: File,
  'file-text': FileText, calendar: Calendar, clock: Clock, bell: Bell, search: Search,
  filter: Filter, edit: Edit, pencil: Pencil, trash: Trash,
  plus: Plus, minus: Minus, check: CheckIcon, x: XIcon,
  'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, 'arrow-up': ArrowUp, 'arrow-down': ArrowDown,
  'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, 'chevron-up': ChevronUp, 'chevron-down': ChevronDown,
  menu: Menu, 'more-horizontal': MoreHorizontal, 'more-vertical': MoreVertical,
  link: Link, 'external-link': ExternalLink, share: Share, send: Send,
  'message-circle': MessageCircle, 'message-square': MessageSquare, bookmark: Bookmark,
  tag: Tag, flag: Flag, award: Award, zap: Zap, sparkles: Sparkles,
  sun: Sun, moon: Moon, 'cloud-rain': CloudRain, snowflake: Snowflake,
  compass: Compass, map: Map, 'map-pin': MapPin, navigation: Navigation, globe: Globe2,
  plane: Plane, car: Car, train: Train, bike: Bike,
  coffee: Coffee, pizza: Pizza, apple: Apple, leaf: Leaf, flower: Flower2, trees: Trees,
  mountain: Mountain, waves: Waves,
  book: Book, 'book-open': BookOpen, 'graduation-cap': GraduationCap, briefcase: Briefcase,
  building: Building, building2: Building2, store: Store,
  'shopping-cart': ShoppingCart, 'shopping-bag': ShoppingBag, 'credit-card': CreditCard,
  wallet: Wallet, 'dollar-sign': DollarSign, 'piggy-bank': PiggyBank,
  gift: Gift, 'party-popper': PartyPopper, cake: Cake, gamepad: Gamepad2, dice: Dice5,
  puzzle: Puzzle, trophy: Trophy, target: Target,
  flame: Flame, lightbulb: Lightbulb, battery: Battery, power: Power,
  wifi: Wifi, bluetooth: Bluetooth, radio: Radio, tv: Tv, monitor: Monitor,
  laptop: Laptop, tablet: Tablet, smartphone: Smartphone, watch: Watch,
  headphones: Headphones, speaker: Speaker, keyboard: Keyboard, mouse: Mouse,
  printer: Printer, scan: ScanLine, cpu: Cpu, 'hard-drive': HardDrive,
  database: Database, server: Server, code: Code, terminal: Terminal,
  bug: Bug, shield: Shield, lock: Lock, unlock: Unlock, key: Key,
  eye: Eye, 'eye-off': EyeOff, fingerprint: Fingerprint,
  users: Users, 'user-plus': UserPlus, 'user-minus': UserMinus, 'user-check': UserCheck,
  contact: Contact, 'badge-check': BadgeCheck,
  github: Github, twitter: Twitter, facebook: Facebook, instagram: Instagram,
  linkedin: Linkedin, youtube: Youtube, twitch: Twitch,
  chrome: Chrome, slack: Slack, figma: Figma, framer: Framer,
  rocket: Rocket, satellite: Satellite, atom: Atom, beaker: Beaker, dna: Dna,
  pill: Pill, stethoscope: Stethoscope,
  hammer: Hammer, wrench: Wrench, ruler: Ruler, scissors: Scissors,
  brush: Brush, 'paint-bucket': PaintBucket, eraser: Eraser, pipette: Pipette, wand: Wand2,
  layers: Layers, layout: Layout, grid: Grid, list: List, table: Table,
  'bar-chart': BarChart, 'pie-chart': PieChart, 'line-chart': LineChart,
  'trending-up': TrendingUp, 'trending-down': TrendingDown, activity: Activity
};

const ICON_NAMES = Object.keys(LUCIDE_ICONS);

// Predefined colors
const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#334155', '#475569', '#64748b', '#1e293b'
];

interface ItemEditModalProps {
  item: WebOSItem;
  onSave: (updates: Partial<WebOSItem>) => void;
  onDelete: () => void;
  onClose: () => void;
  uiScale?: number;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({
  item,
  onSave,
  onDelete,
  onClose,
  uiScale = 1
}) => {
  const [title, setTitle] = useState(item.title);
  const [iconType, setIconType] = useState<'emoji' | 'lucide' | 'url'>('emoji');
  const [emojiIcon, setEmojiIcon] = useState(item.icon || '📱');
  const [lucideIcon, setLucideIcon] = useState('star');
  const [iconSearch, setIconSearch] = useState('');
  const [bgColor, setBgColor] = useState(item.bgColor || '#334155');
  const [url, setUrl] = useState((item as WebOSAppItem).url || '');
  const [favicon, setFavicon] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Detect initial icon type
  useEffect(() => {
    if (item.icon) {
      if (item.icon.startsWith('http') || item.icon.startsWith('data:')) {
        setIconType('url');
      } else if (item.icon.startsWith('lucide:')) {
        setIconType('lucide');
        setLucideIcon(item.icon.replace('lucide:', ''));
      } else {
        setIconType('emoji');
        setEmojiIcon(item.icon);
      }
    }
  }, [item.icon]);

  // Fetch favicon when URL changes
  useEffect(() => {
    if (!url) {
      setFavicon(null);
      return;
    }
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
      setFavicon(faviconUrl);
    } catch {
      setFavicon(null);
    }
  }, [url]);

  const filteredIcons = ICON_NAMES.filter(name => 
    name.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const getCurrentIcon = () => {
    if (iconType === 'lucide') return `lucide:${lucideIcon}`;
    if (iconType === 'url' && favicon) return favicon;
    return emojiIcon;
  };

  const handleSave = () => {
    const updates: Partial<WebOSItem> = {
      title,
      icon: getCurrentIcon(),
      bgColor
    };
    if (item.type === 'app' && url) {
      (updates as Partial<WebOSAppItem>).url = url.startsWith('http') ? url : `https://${url}`;
    }
    onSave(updates);
    onClose();
  };

  const renderCurrentIcon = () => {
    if (iconType === 'lucide') {
      const IconComponent = LUCIDE_ICONS[lucideIcon];
      return IconComponent ? <IconComponent size={32} className="text-white" /> : <Star size={32} className="text-white" />;
    }
    if (iconType === 'url' && favicon) {
      return <img src={favicon} alt="" className="w-8 h-8 object-contain" />;
    }
    return <span className="text-3xl">{emojiIcon}</span>;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ zoom: uiScale }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Modifier l'élément</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-colors"
              style={{ backgroundColor: bgColor }}
            >
              {renderCurrentIcon()}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Nom</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition"
              placeholder="Nom de l'application"
            />
          </div>

          {/* URL (for apps) */}
          {item.type === 'app' && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <Globe size={14} className="inline mr-2" />
                URL
              </label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition"
                placeholder="https://example.com"
              />
              {favicon && (
                <p className="text-xs text-white/50 mt-2 flex items-center gap-2">
                  <img src={favicon} alt="" className="w-4 h-4" />
                  Favicon détecté automatiquement
                </p>
              )}
            </div>
          )}

          {/* Icon Type Selector */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Type d'icône</label>
            <div className="flex gap-2">
              {['emoji', 'lucide', 'url'].map(type => (
                <button
                  key={type}
                  onClick={() => setIconType(type as typeof iconType)}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition ${
                    iconType === type 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {type === 'emoji' ? '😀 Emoji' : type === 'lucide' ? '⚡ Lucide' : '🌐 Web'}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection based on type */}
          {iconType === 'emoji' && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Emoji</label>
              <input
                type="text"
                value={emojiIcon}
                onChange={e => setEmojiIcon(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                maxLength={4}
              />
            </div>
          )}

          {iconType === 'lucide' && (
            <div className="relative">
              <label className="block text-sm font-medium text-white/70 mb-2">Icône Lucide</label>
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-between hover:bg-white/10 transition"
              >
                <span className="flex items-center gap-3">
                  {LUCIDE_ICONS[lucideIcon] && React.createElement(LUCIDE_ICONS[lucideIcon], { size: 20 })}
                  <span>{lucideIcon}</span>
                </span>
                <ChevronDown size={16} className={`transition-transform ${showIconPicker ? 'rotate-180' : ''}`} />
              </button>
              
              {showIconPicker && (
                <div className="absolute z-10 mt-2 w-full max-h-64 overflow-hidden rounded-xl bg-slate-800 border border-white/10 shadow-xl">
                  <div className="p-2 border-b border-white/10">
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={e => setIconSearch(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none"
                      placeholder="Rechercher..."
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto p-2 grid grid-cols-6 gap-1">
                    {filteredIcons.slice(0, 60).map(name => {
                      const IconComp = LUCIDE_ICONS[name];
                      return (
                        <button
                          key={name}
                          onClick={() => {
                            setLucideIcon(name);
                            setShowIconPicker(false);
                            setIconSearch('');
                          }}
                          className={`p-2 rounded-lg hover:bg-white/10 transition ${lucideIcon === name ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/70'}`}
                          title={name}
                        >
                          <IconComp size={20} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {iconType === 'url' && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Favicon depuis l'URL</label>
              {favicon ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <img src={favicon} alt="" className="w-12 h-12 rounded-lg shadow-lg" />
                    <div className="flex-1">
                      <p className="text-white/90 text-sm font-medium">Favicon détecté</p>
                      <p className="text-white/50 text-xs truncate">{url}</p>
                    </div>
                    <Check size={18} className="text-green-400" />
                  </div>
                  <p className="text-xs text-white/50 text-center">
                    Le favicon sera utilisé comme icône pour cette application
                  </p>
                </div>
              ) : (
                <p className="text-white/50 text-sm p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  Entrez une URL ci-dessus pour récupérer le favicon automatiquement
                </p>
              )}
            </div>
          )}

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              <Palette size={14} className="inline mr-2" />
              Couleur de fond
            </label>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition"
            >
              <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: bgColor }} />
              <span className="text-white/70">{bgColor}</span>
            </button>
            
            {showColorPicker && (
              <div className="mt-2 p-3 rounded-xl bg-slate-800 border border-white/10 grid grid-cols-7 gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      setBgColor(color);
                      setShowColorPicker(false);
                    }}
                    className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${bgColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20">
          <button
            onClick={() => {
              if (window.confirm('Supprimer cet élément ?')) {
                onDelete();
                onClose();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
          >
            <Trash2 size={16} />
            Supprimer
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition"
            >
              <Check size={16} />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to render Lucide icon by name
export const renderLucideIcon = (name: string, size = 20, className = '') => {
  const iconName = name.replace('lucide:', '');
  const IconComponent = LUCIDE_ICONS[iconName];
  if (IconComponent) {
    return <IconComponent size={size} className={className} />;
  }
  return null;
};

export { LUCIDE_ICONS };
