import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  BarChart3,
  Beer,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  GlassWater,
  Home,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Wine,
  X,
} from 'lucide-react';
import {
  ACIDITY_LEVELS,
  BASE_SPIRITS,
  BODY_LEVELS,
  COMMON_FLAVOR_TAGS,
  DRINK_TYPE_LABELS,
  DRINK_TYPES,
  PURCHASE_SOURCES,
  SCENE_SUGGESTIONS,
  SWEETNESS_LEVELS,
  TANNIN_LEVELS,
  WINE_COLORS,
} from './constants';
import { wineRepository } from './data/repository';
import { attachDrinkStats, buildPreferenceProfile, buildRecommendations } from './services/recommendations';
import type {
  AcidityLevel,
  BaseSpirit,
  BodyLevel,
  DrinkItem,
  DrinkLog,
  DrinkType,
  DrinkWithStats,
  PurchaseSource,
  SweetnessLevel,
  TanninLevel,
  WineBackup,
  WineColor,
} from './types';
import { createId, formatDate, formatFullDate, formatMoney, formatRating, parseTags, todayInputValue } from './utils/format';
import { compressDrinkPhoto } from './utils/image';

type Tab = 'home' | 'drinks' | 'add' | 'insights' | 'settings';
type AddMode = 'drink' | 'log';
type TypeFilter = '全部' | DrinkType;

const repository = wineRepository;

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [addMode, setAddMode] = useState<AddMode>('drink');
  const [drinks, setDrinks] = useState<DrinkItem[]>([]);
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('全部');
  const [minRating, setMinRating] = useState(0);
  const [selectedDrinkId, setSelectedDrinkId] = useState<string | null>(null);
  const [editingDrink, setEditingDrink] = useState<DrinkItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = async () => {
    const [nextDrinks, nextLogs] = await Promise.all([repository.listDrinks(), repository.listLogs()]);
    setDrinks(nextDrinks);
    setLogs(nextLogs);
    setIsLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const drinkStats = useMemo(() => attachDrinkStats(drinks, logs), [drinks, logs]);
  const selectedDrink = drinkStats.find((drink) => drink.id === selectedDrinkId) || null;
  const recommendations = useMemo(() => buildRecommendations(drinks, logs), [drinks, logs]);
  const profile = useMemo(() => buildPreferenceProfile(drinks, logs), [drinks, logs]);

  const filteredDrinks = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return drinkStats.filter((drink) => {
      const matchesKeyword =
        !keyword ||
        [
          drink.name,
          drink.producer,
          drink.country,
          drink.region,
          drink.recipe,
          drink.method,
          drink.style,
          drink.originMaterial,
          drink.agingNote,
          drink.notes,
          drink.baseSpirit,
          drink.wineColor,
          ...drink.grapes,
          ...drink.flavorTags,
        ]
          .join(' ')
          .toLowerCase()
          .includes(keyword);
      const matchesType = typeFilter === '全部' || drink.type === typeFilter;
      const matchesRating = !minRating || (drink.averageRating || 0) >= minRating;
      return matchesKeyword && matchesType && matchesRating;
    });
  }, [drinkStats, minRating, query, typeFilter]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  };

  const handleSaveDrink = async (input: DrinkFormValue) => {
    const now = new Date().toISOString();
    const drink: DrinkItem = {
      id: editingDrink?.id || createId('drink'),
      type: input.type,
      name: input.name.trim(),
      producer: input.producer.trim(),
      country: input.country.trim(),
      region: input.region.trim(),
      vintage: input.vintage ? Number(input.vintage) : undefined,
      wineColor: input.type === 'wine' ? input.wineColor : undefined,
      grapes: input.type === 'wine' ? parseTags(input.grapes) : [],
      body: input.type === 'wine' ? input.body : undefined,
      sweetness: input.type === 'wine' ? input.sweetness : undefined,
      acidity: input.type === 'wine' ? input.acidity : undefined,
      tannin: input.type === 'wine' ? input.tannin : undefined,
      alcoholPercent: input.alcoholPercent ? Number(input.alcoholPercent) : undefined,
      decantingNote: input.type === 'wine' ? input.decantingNote.trim() : '',
      style: input.type !== 'wine' && input.type !== 'cocktail' ? input.style.trim() : '',
      originMaterial: input.type !== 'wine' && input.type !== 'cocktail' ? input.originMaterial.trim() : '',
      agingNote: input.type !== 'wine' && input.type !== 'cocktail' ? input.agingNote.trim() : '',
      baseSpirit: input.type === 'cocktail' ? input.baseSpirit : undefined,
      recipe: input.type === 'cocktail' ? input.recipe.trim() : '',
      method: input.type === 'cocktail' ? input.method.trim() : '',
      glassware: input.type === 'cocktail' ? input.glassware.trim() : '',
      ice: input.type === 'cocktail' ? input.ice.trim() : '',
      garnish: input.type === 'cocktail' ? input.garnish.trim() : '',
      isHomemade: input.type === 'cocktail' ? input.isHomemade : undefined,
      flavorTags: parseTags(input.flavorTags),
      purchaseDate: input.purchaseDate,
      purchaseUrl: input.purchaseUrl.trim() || undefined,
      purchaseSource: input.purchaseSource,
      photoDataUrl: input.photoDataUrl || undefined,
      photoUpdatedAt: input.photoDataUrl ? input.photoUpdatedAt || now : undefined,
      price: input.price ? Number(input.price) : undefined,
      volumeMl: input.volumeMl ? Number(input.volumeMl) : undefined,
      notes: input.notes.trim(),
      wantAgain: input.wantAgain,
      createdAt: editingDrink?.createdAt || now,
      updatedAt: now,
    };
    await repository.saveDrink(drink);
    await refresh();
    setEditingDrink(null);
    setSelectedDrinkId(drink.id);
    setActiveTab('drinks');
    showNotice(editingDrink ? '档案已更新' : '已加入新的记录对象');
  };

  const handleSaveLog = async (input: LogFormValue) => {
    const now = new Date().toISOString();
    const log: DrinkLog = {
      id: createId('log'),
      drinkId: input.drinkId,
      date: input.date,
      scene: input.scene.trim(),
      place: input.place.trim(),
      pairing: input.pairing.trim(),
      rating: Number(input.rating),
      aroma: Number(input.aroma),
      palate: Number(input.palate),
      finish: Number(input.finish),
      notes: input.notes.trim(),
      createdAt: now,
      updatedAt: now,
    };
    await repository.saveLog(log);
    await refresh();
    setSelectedDrinkId(log.drinkId);
    setActiveTab('drinks');
    showNotice('这次饮用已记录');
  };

  const handleDeleteDrink = async (drinkId: string) => {
    if (!window.confirm('删除这个档案会同时删除它的饮用记录，确定继续吗？')) return;
    await repository.deleteDrink(drinkId);
    await refresh();
    setSelectedDrinkId(null);
    showNotice('档案和相关记录已删除');
  };

  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm('确定删除这条饮用记录吗？')) return;
    await repository.deleteLog(logId);
    await refresh();
    showNotice('饮用记录已删除');
  };

  const handleExport = async () => {
    const backup = await repository.exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wine-memory-${todayInputValue()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice('备份文件已生成');
  };

  const handleImport = async (file: File) => {
    try {
      const backup = JSON.parse(await file.text()) as WineBackup;
      await repository.importBackup(backup);
      await refresh();
      setSelectedDrinkId(null);
      showNotice('备份已导入');
    } catch (error) {
      showNotice(error instanceof Error ? error.message : '导入失败');
    }
  };

  const handleClear = async () => {
    if (!window.confirm('这会清空本机所有酒类记录。建议先导出备份，确定继续吗？')) return;
    await repository.clearAll();
    await refresh();
    setSelectedDrinkId(null);
    showNotice('本机记录已清空');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src="/icon.svg" alt="" className="brand-icon" />
          <div>
            <p className="eyebrow">Wine Memory</p>
            <h1>我的酒与鸡尾酒记录</h1>
          </div>
        </div>
        <button
          className="icon-button"
          type="button"
          title="新增记录"
          onClick={() => {
            setEditingDrink(null);
            setAddMode(drinks.length ? 'log' : 'drink');
            setActiveTab('add');
          }}
        >
          <Plus size={20} />
        </button>
      </header>

      <main className="content">
        {isLoading ? (
          <EmptyState title="正在读取本机记录" body="IndexedDB 初始化中。" />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                drinks={drinkStats}
                logs={logs}
                recommendations={recommendations}
                onOpenDrink={(id) => {
                  setSelectedDrinkId(id);
                  setActiveTab('drinks');
                }}
                onAddDrink={() => {
                  setEditingDrink(null);
                  setAddMode('drink');
                  setActiveTab('add');
                }}
              />
            )}

            {activeTab === 'drinks' && (
              <DrinksView
                drinks={filteredDrinks}
                allDrinks={drinkStats}
                selectedDrink={selectedDrink}
                query={query}
                typeFilter={typeFilter}
                minRating={minRating}
                onQueryChange={setQuery}
                onTypeFilterChange={setTypeFilter}
                onMinRatingChange={setMinRating}
                onSelectDrink={setSelectedDrinkId}
                onEditDrink={(drink) => {
                  setEditingDrink(drink);
                  setAddMode('drink');
                  setActiveTab('add');
                }}
                onDeleteDrink={handleDeleteDrink}
                onDeleteLog={handleDeleteLog}
              />
            )}

            {activeTab === 'add' && (
              <AddView
                drinks={drinks}
                mode={addMode}
                editingDrink={editingDrink}
                onModeChange={(mode) => {
                  setEditingDrink(null);
                  setAddMode(mode);
                }}
                onSaveDrink={handleSaveDrink}
                onSaveLog={handleSaveLog}
                onCancelEdit={() => {
                  setEditingDrink(null);
                  setActiveTab('drinks');
                }}
              />
            )}

            {activeTab === 'insights' && <InsightsView profile={profile} recommendations={recommendations} logs={logs} />}

            {activeTab === 'settings' && (
              <SettingsView
                drinkCount={drinks.length}
                logCount={logs.length}
                onExport={handleExport}
                onImportClick={() => importInputRef.current?.click()}
                onClear={handleClear}
              />
            )}
          </>
        )}
      </main>

      <nav className="bottom-nav" aria-label="主要导航">
        <NavButton active={activeTab === 'home'} icon={<Home size={19} />} label="首页" onClick={() => setActiveTab('home')} />
        <NavButton active={activeTab === 'drinks'} icon={<Wine size={19} />} label="酒单" onClick={() => setActiveTab('drinks')} />
        <NavButton
          active={activeTab === 'add'}
          icon={<Plus size={19} />}
          label="新增"
          onClick={() => {
            setEditingDrink(null);
            setActiveTab('add');
          }}
        />
        <NavButton active={activeTab === 'insights'} icon={<BarChart3 size={19} />} label="建议" onClick={() => setActiveTab('insights')} />
        <NavButton active={activeTab === 'settings'} icon={<Settings size={19} />} label="设置" onClick={() => setActiveTab('settings')} />
      </nav>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleImport(file);
          event.currentTarget.value = '';
        }}
      />
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

function HomeView({
  drinks,
  logs,
  recommendations,
  onOpenDrink,
  onAddDrink,
}: {
  drinks: DrinkWithStats[];
  logs: DrinkLog[];
  recommendations: ReturnType<typeof buildRecommendations>;
  onOpenDrink: (id: string) => void;
  onAddDrink: () => void;
}) {
  const latestLogs = logs.slice(0, 4);
  const topDrinks = [...drinks]
    .filter((drink) => drink.averageRating)
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 3);
  const wantAgainDrinks = drinks.filter((drink) => drink.wantAgain).slice(0, 3);

  if (!drinks.length) {
    return (
      <section className="stack">
        <EmptyState title="从第一瓶或第一杯开始" body="记录酒款、鸡尾酒和每次饮用，之后这里会自动整理偏好与复购方向。" />
        <button className="primary-action" type="button" onClick={onAddDrink}>
          <Plus size={18} />
          新增第一条档案
        </button>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="metric-grid">
        <Metric label="档案" value={drinks.length.toString()} />
        <Metric label="饮用" value={logs.length.toString()} />
        <Metric label="均分" value={formatRating(logs.length ? logs.reduce((sum, log) => sum + log.rating, 0) / logs.length : undefined)} />
      </div>

      <SectionHeader title="下一步喝什么" action="看建议" />
      <RecommendationList recommendations={recommendations.slice(0, 2)} />

      <SectionHeader title="最近喝过" />
      <div className="item-list">
        {latestLogs.length ? (
          latestLogs.map((log) => {
            const drink = drinks.find((item) => item.id === log.drinkId);
            return (
              <button className="list-item" type="button" key={log.id} onClick={() => drink && onOpenDrink(drink.id)}>
                {drink && <DrinkPhoto drink={drink} className="list-item-photo" />}
                <div className="list-item-copy">
                  <p className="item-title">{drink?.name || '未知记录'}</p>
                  <p className="item-meta">
                    {formatFullDate(log.date)} · {log.scene || '未记场景'} · {log.place || '未记地点'}
                  </p>
                </div>
                <strong>{log.rating.toFixed(1)}</strong>
              </button>
            );
          })
        ) : (
          <EmptyState title="还没有饮用记录" body="新增一次饮用后，最近喝过会显示在这里。" compact />
        )}
      </div>

      <SectionHeader title="高分记录" />
      <DrinkScroller drinks={topDrinks} onOpenDrink={onOpenDrink} emptyText="有评分后会自动出现高分酒款和鸡尾酒。" />

      <SectionHeader title="想复购 / 再调" />
      <DrinkScroller drinks={wantAgainDrinks} onOpenDrink={onOpenDrink} emptyText="在详情里标记想再喝后会出现在这里。" />
    </section>
  );
}

function DrinksView({
  drinks,
  allDrinks,
  selectedDrink,
  query,
  typeFilter,
  minRating,
  onQueryChange,
  onTypeFilterChange,
  onMinRatingChange,
  onSelectDrink,
  onEditDrink,
  onDeleteDrink,
  onDeleteLog,
}: {
  drinks: DrinkWithStats[];
  allDrinks: DrinkWithStats[];
  selectedDrink: DrinkWithStats | null;
  query: string;
  typeFilter: TypeFilter;
  minRating: number;
  onQueryChange: (value: string) => void;
  onTypeFilterChange: (value: TypeFilter) => void;
  onMinRatingChange: (value: number) => void;
  onSelectDrink: (id: string | null) => void;
  onEditDrink: (drink: DrinkItem) => void;
  onDeleteDrink: (id: string) => void;
  onDeleteLog: (id: string) => void;
}) {
  if (selectedDrink) {
    return (
      <DrinkDetail
        drink={selectedDrink}
        onBack={() => onSelectDrink(null)}
        onEditDrink={onEditDrink}
        onDeleteDrink={onDeleteDrink}
        onDeleteLog={onDeleteLog}
      />
    );
  }

  return (
    <section className="stack">
      <div className="search-box">
        <Search size={18} />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索名称、产区、基酒、风味" />
      </div>

      <div className="filter-row">
        <SelectPill value={typeFilter} onChange={(value) => onTypeFilterChange(value as TypeFilter)} options={['全部', ...DRINK_TYPES]} labels={DRINK_TYPE_LABELS} />
        <label className="rating-filter">
          <Star size={15} />
          <input type="number" min="0" max="5" step="0.5" value={minRating} onChange={(event) => onMinRatingChange(Number(event.target.value))} />
        </label>
      </div>

      <p className="subtle">
        显示 {drinks.length} / {allDrinks.length} 条档案
      </p>

      <div className="drink-grid">
        {drinks.length ? (
          drinks.map((drink) => <DrinkCard key={drink.id} drink={drink} onClick={() => onSelectDrink(drink.id)} />)
        ) : (
          <EmptyState title="没有匹配记录" body="换个关键词或清空筛选条件试试。" />
        )}
      </div>
    </section>
  );
}

function DrinkDetail({
  drink,
  onBack,
  onEditDrink,
  onDeleteDrink,
  onDeleteLog,
}: {
  drink: DrinkWithStats;
  onBack: () => void;
  onEditDrink: (drink: DrinkItem) => void;
  onDeleteDrink: (id: string) => void;
  onDeleteLog: (id: string) => void;
}) {
  return (
    <section className="stack">
      <button className="text-button" type="button" onClick={onBack}>
        返回列表
      </button>
      <article className="detail-panel">
        {drink.photoDataUrl && <DrinkPhoto drink={drink} className="detail-photo" />}
        <div className="detail-heading">
          <div>
            <p className="eyebrow">{DRINK_TYPE_LABELS[drink.type]}</p>
            <h2>{drink.name}</h2>
            <p className="item-meta">{drinkMeta(drink)}</p>
          </div>
          <div className="score-badge">{formatRating(drink.averageRating)}</div>
        </div>

        <div className="chip-row">
          {drink.flavorTags.map((tag) => (
            <span className="chip" key={tag}>
              {tag}
            </span>
          ))}
          {drink.wantAgain && <span className="chip positive">想再喝</span>}
        </div>

        <dl className="info-grid">
          <div>
            <dt>{drink.type === 'cocktail' ? '来源' : '品牌 / 生产方'}</dt>
            <dd>{drink.producer || '未记录'}</dd>
          </div>
          <div>
            <dt>购买日期</dt>
            <dd>{formatFullDate(drink.purchaseDate)}</dd>
          </div>
          <div>
            <dt>价格</dt>
            <dd>{formatMoney(drink.price)}</dd>
          </div>
          <div>
            <dt>容量</dt>
            <dd>{drink.volumeMl ? `${drink.volumeMl}ml` : '未记录'}</dd>
          </div>
          <div>
            <dt>购买来源</dt>
            <dd>{drink.purchaseSource || '未记录'}</dd>
          </div>
          <div>
            <dt>酒精度</dt>
            <dd>{drink.alcoholPercent ? `${drink.alcoholPercent}%` : '未记录'}</dd>
          </div>
        </dl>

        {drink.type === 'wine' && <WineDetailFields drink={drink} />}
        {drink.type === 'cocktail' && <CocktailDetailFields drink={drink} />}
        {drink.type !== 'wine' && drink.type !== 'cocktail' && <GeneralDrinkDetailFields drink={drink} />}
        {drink.notes && <p className="note-block">{drink.notes}</p>}

        <div className="action-row">
          {drink.purchaseUrl && (
            <a className="secondary-action link-action" href={drink.purchaseUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={17} />
              打开链接
            </a>
          )}
          <button className="secondary-action" type="button" onClick={() => onEditDrink(drink)}>
            <Pencil size={17} />
            编辑
          </button>
          <button className="danger-action" type="button" onClick={() => onDeleteDrink(drink.id)}>
            <Trash2 size={17} />
            删除
          </button>
        </div>
      </article>

      <SectionHeader title="饮用记录" />
      <div className="item-list">
        {drink.logs.length ? (
          drink.logs.map((log) => (
            <article className="log-card" key={log.id}>
              <div className="log-card-head">
                <div>
                  <p className="item-title">{formatFullDate(log.date)}</p>
                  <p className="item-meta">
                    {log.scene || '未记场景'} · {log.place || '未记地点'} · {log.pairing || '未记搭配'}
                  </p>
                </div>
                <strong>{log.rating.toFixed(1)}</strong>
              </div>
              <div className="mini-metrics">
                <span>香气 {log.aroma}</span>
                <span>口感 {log.palate}</span>
                <span>余味 {log.finish}</span>
              </div>
              {log.notes && <p>{log.notes}</p>}
              <button className="text-button danger-text" type="button" onClick={() => onDeleteLog(log.id)}>
                <Trash2 size={15} />
                删除这次
              </button>
            </article>
          ))
        ) : (
          <EmptyState title="还没记录喝过" body="新增饮用后，会在这里看到每次体验。" compact />
        )}
      </div>
    </section>
  );
}

function WineDetailFields({ drink }: { drink: DrinkItem }) {
  return (
    <>
      <dl className="info-grid">
        <div>
          <dt>葡萄品种</dt>
          <dd>{drink.grapes.length ? drink.grapes.join('，') : '未记录'}</dd>
        </div>
        <div>
          <dt>结构</dt>
          <dd>
            {[drink.body, drink.sweetness, drink.acidity && `${drink.acidity}酸`, drink.tannin && `${drink.tannin}单宁`]
              .filter(Boolean)
              .join(' · ') || '未记录'}
          </dd>
        </div>
      </dl>
      {drink.decantingNote && <p className="note-block">{drink.decantingNote}</p>}
    </>
  );
}

function CocktailDetailFields({ drink }: { drink: DrinkItem }) {
  return (
    <>
      <dl className="info-grid">
        <div>
          <dt>配方</dt>
          <dd>{drink.recipe || '未记录'}</dd>
        </div>
        <div>
          <dt>做法</dt>
          <dd>{drink.method || '未记录'}</dd>
        </div>
        <div>
          <dt>杯型 / 冰</dt>
          <dd>{[drink.glassware, drink.ice].filter(Boolean).join(' · ') || '未记录'}</dd>
        </div>
        <div>
          <dt>装饰</dt>
          <dd>{drink.garnish || '未记录'}</dd>
        </div>
      </dl>
    </>
  );
}

function GeneralDrinkDetailFields({ drink }: { drink: DrinkItem }) {
  return (
    <dl className="info-grid">
      <div>
        <dt>风格 / 类型</dt>
        <dd>{drink.style || '未记录'}</dd>
      </div>
      <div>
        <dt>原料</dt>
        <dd>{drink.originMaterial || '未记录'}</dd>
      </div>
      <div>
        <dt>产地</dt>
        <dd>{[drink.country, drink.region].filter(Boolean).join(' · ') || '未记录'}</dd>
      </div>
      <div>
        <dt>陈年 / 工艺</dt>
        <dd>{drink.agingNote || '未记录'}</dd>
      </div>
    </dl>
  );
}

function AddView({
  drinks,
  mode,
  editingDrink,
  onModeChange,
  onSaveDrink,
  onSaveLog,
  onCancelEdit,
}: {
  drinks: DrinkItem[];
  mode: AddMode;
  editingDrink: DrinkItem | null;
  onModeChange: (mode: AddMode) => void;
  onSaveDrink: (value: DrinkFormValue) => void;
  onSaveLog: (value: LogFormValue) => void;
  onCancelEdit: () => void;
}) {
  return (
    <section className="stack">
      {!editingDrink && (
        <div className="segmented">
          <button className={mode === 'drink' ? 'active' : ''} type="button" onClick={() => onModeChange('drink')}>
            档案
          </button>
          <button className={mode === 'log' ? 'active' : ''} type="button" onClick={() => onModeChange('log')}>
            饮用
          </button>
        </div>
      )}

      {mode === 'drink' ? (
        <DrinkForm key={editingDrink?.id || 'new-drink'} initialDrink={editingDrink} onSubmit={onSaveDrink} onCancel={editingDrink ? onCancelEdit : undefined} />
      ) : (
        <LogForm drinks={drinks} onSubmit={onSaveLog} />
      )}
    </section>
  );
}

function InsightsView({
  profile,
  recommendations,
  logs,
}: {
  profile: ReturnType<typeof buildPreferenceProfile>;
  recommendations: ReturnType<typeof buildRecommendations>;
  logs: DrinkLog[];
}) {
  return (
    <section className="stack">
      <div className="metric-grid">
        <Metric label="档案" value={profile.totalDrinks.toString()} />
        <Metric label="饮用" value={profile.totalLogs.toString()} />
        <Metric label="均分" value={formatRating(profile.averageRating)} />
      </div>

      <SectionHeader title="建议" />
      <RecommendationList recommendations={recommendations} />

      <SectionHeader title="偏好信号" />
      <div className="signal-grid">
        <SignalBlock title="类型" signals={profile.topTypes} />
        <SignalBlock title="国家" signals={profile.topCountries} />
        <SignalBlock title="产区" signals={profile.topRegions} />
        <SignalBlock title="酒款类型" signals={profile.topWineColors} />
        <SignalBlock title="基酒" signals={profile.topBaseSpirits} />
        <SignalBlock title="风味" signals={profile.topFlavors} />
        <SignalBlock title="场景" signals={profile.topScenes} />
      </div>

      <SectionHeader title="评分趋势" />
      <RatingTrend logs={logs} />
    </section>
  );
}

function SettingsView({
  drinkCount,
  logCount,
  onExport,
  onImportClick,
  onClear,
}: {
  drinkCount: number;
  logCount: number;
  onExport: () => void;
  onImportClick: () => void;
  onClear: () => void;
}) {
  return (
    <section className="stack">
      <article className="detail-panel">
        <p className="eyebrow">本机数据</p>
        <h2>{drinkCount} 条档案 · {logCount} 次饮用</h2>
        <p className="subtle">数据保存在当前浏览器 IndexedDB，不会上传到服务器。换域名、清浏览器数据或换设备前，请先导出 JSON 备份。</p>
      </article>

      <div className="settings-actions">
        <button className="primary-action" type="button" onClick={onExport}>
          <Download size={18} />
          导出 JSON 备份
        </button>
        <button className="secondary-action" type="button" onClick={onImportClick}>
          <Upload size={18} />
          导入 JSON 备份
        </button>
        <button className="danger-action" type="button" onClick={onClear}>
          <Trash2 size={18} />
          清空本机数据
        </button>
      </div>

      <article className="detail-panel">
        <p className="eyebrow">iPhone 安装</p>
        <h2>用 Safari 添加到主屏幕</h2>
        <p className="subtle">部署到 HTTPS 地址后，用 iPhone Safari 打开，选择分享按钮，再选择添加到主屏幕。之后它会像普通 app 一样启动。</p>
      </article>
    </section>
  );
}

interface DrinkFormValue {
  type: DrinkType;
  name: string;
  producer: string;
  country: string;
  region: string;
  vintage: string;
  wineColor: WineColor;
  grapes: string;
  body: BodyLevel;
  sweetness: SweetnessLevel;
  acidity: AcidityLevel;
  tannin: TanninLevel;
  alcoholPercent: string;
  decantingNote: string;
  style: string;
  originMaterial: string;
  agingNote: string;
  baseSpirit: BaseSpirit;
  recipe: string;
  method: string;
  glassware: string;
  ice: string;
  garnish: string;
  isHomemade: boolean;
  flavorTags: string;
  purchaseDate: string;
  purchaseUrl: string;
  purchaseSource: PurchaseSource;
  photoDataUrl?: string;
  photoUpdatedAt?: string;
  price: string;
  volumeMl: string;
  notes: string;
  wantAgain: boolean;
}

function DrinkForm({
  initialDrink,
  onSubmit,
  onCancel,
}: {
  initialDrink: DrinkItem | null;
  onSubmit: (value: DrinkFormValue) => void;
  onCancel?: () => void;
}) {
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [value, setValue] = useState<DrinkFormValue>(() => ({
    type: initialDrink?.type || 'wine',
    name: initialDrink?.name || '',
    producer: initialDrink?.producer || '',
    country: initialDrink?.country || '',
    region: initialDrink?.region || '',
    vintage: initialDrink?.vintage?.toString() || '',
    wineColor: initialDrink?.wineColor || '红',
    grapes: initialDrink?.grapes.join('，') || '',
    body: initialDrink?.body || '中等',
    sweetness: initialDrink?.sweetness || '干型',
    acidity: initialDrink?.acidity || '中',
    tannin: initialDrink?.tannin || '中',
    alcoholPercent: initialDrink?.alcoholPercent?.toString() || '',
    decantingNote: initialDrink?.decantingNote || '',
    style: initialDrink?.style || '',
    originMaterial: initialDrink?.originMaterial || '',
    agingNote: initialDrink?.agingNote || '',
    baseSpirit: initialDrink?.baseSpirit || '金酒',
    recipe: initialDrink?.recipe || '',
    method: initialDrink?.method || '',
    glassware: initialDrink?.glassware || '',
    ice: initialDrink?.ice || '',
    garnish: initialDrink?.garnish || '',
    isHomemade: initialDrink?.isHomemade || false,
    flavorTags: initialDrink?.flavorTags.join('，') || '',
    purchaseDate: initialDrink?.purchaseDate || todayInputValue(),
    purchaseUrl: initialDrink?.purchaseUrl || '',
    purchaseSource: initialDrink?.purchaseSource || '其他',
    photoDataUrl: initialDrink?.photoDataUrl,
    photoUpdatedAt: initialDrink?.photoUpdatedAt,
    price: initialDrink?.price?.toString() || '',
    volumeMl: initialDrink?.volumeMl?.toString() || '',
    notes: initialDrink?.notes || '',
    wantAgain: initialDrink?.wantAgain || false,
  }));

  const patch = <K extends keyof DrinkFormValue>(key: K, next: DrinkFormValue[K]) => setValue((current) => ({ ...current, [key]: next }));
  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return;
    setIsPhotoProcessing(true);
    setPhotoError('');
    try {
      const photoDataUrl = await compressDrinkPhoto(file);
      setValue((current) => ({
        ...current,
        photoDataUrl,
        photoUpdatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : '图片处理失败');
    } finally {
      setIsPhotoProcessing(false);
    }
  };

  const removePhoto = () => {
    setValue((current) => ({
      ...current,
      photoDataUrl: undefined,
      photoUpdatedAt: undefined,
    }));
    setPhotoError('');
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  return (
    <form
      className="form-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <h2>{initialDrink ? '编辑档案' : '新增档案'}</h2>
      <div className="segmented compact">
        {DRINK_TYPES.map((type) => (
          <button className={value.type === type ? 'active' : ''} type="button" key={type} onClick={() => patch('type', type)}>
            {DRINK_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="photo-field">
        <div className="photo-preview">
          {value.photoDataUrl ? (
            <img src={value.photoDataUrl} alt="照片预览" />
          ) : (
            <div className="photo-placeholder">
              <ImagePlus size={26} />
              <span>主图</span>
            </div>
          )}
        </div>
        <div className="photo-actions">
          <p className="field-title">照片</p>
          <p className="subtle">从相机或相册选择一张照片，保存后会显示在列表和详情里。</p>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              handlePhotoChange(event.target.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
          <div className="photo-button-row">
            <button className="secondary-action" type="button" onClick={() => photoInputRef.current?.click()} disabled={isPhotoProcessing}>
              <ImagePlus size={17} />
              {isPhotoProcessing ? '处理中' : value.photoDataUrl ? '更换照片' : '选择照片'}
            </button>
            {value.photoDataUrl && (
              <button className="text-button danger-text" type="button" onClick={removePhoto}>
                <X size={16} />
                移除
              </button>
            )}
          </div>
          {photoError && <p className="form-error">{photoError}</p>}
        </div>
      </div>

      <Field label={`${DRINK_TYPE_LABELS[value.type]}名称`} required>
        <input required value={value.name} onChange={(event) => patch('name', event.target.value)} placeholder={namePlaceholder(value.type)} />
      </Field>
      <Field label={value.type === 'cocktail' ? '来源 / 酒吧' : '品牌 / 生产方'}>
        <input value={value.producer} onChange={(event) => patch('producer', event.target.value)} placeholder={producerPlaceholder(value.type)} />
      </Field>

      {value.type === 'wine' ? (
        <>
          <div className="form-grid">
            <Field label="国家 / 地区"><input value={value.country} onChange={(event) => patch('country', event.target.value)} placeholder="法国、意大利、智利" /></Field>
            <Field label="产区"><input value={value.region} onChange={(event) => patch('region', event.target.value)} placeholder="波尔多、里奥哈、纳帕" /></Field>
          </div>
          <div className="form-grid">
            <Field label="年份"><input type="number" min="1900" max="2100" inputMode="numeric" value={value.vintage} onChange={(event) => patch('vintage', event.target.value)} placeholder="2020" /></Field>
            <Field label="类型"><select value={value.wineColor} onChange={(event) => patch('wineColor', event.target.value as WineColor)}>{WINE_COLORS.map((item) => <option key={item}>{item}</option>)}</select></Field>
          </div>
          <Field label="葡萄品种"><input value={value.grapes} onChange={(event) => patch('grapes', event.target.value)} placeholder="用逗号分隔，例如 黑皮诺，霞多丽" /></Field>
          <div className="form-grid">
            <Field label="酒体"><select value={value.body} onChange={(event) => patch('body', event.target.value as BodyLevel)}>{BODY_LEVELS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="甜度"><select value={value.sweetness} onChange={(event) => patch('sweetness', event.target.value as SweetnessLevel)}>{SWEETNESS_LEVELS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="酸度"><select value={value.acidity} onChange={(event) => patch('acidity', event.target.value as AcidityLevel)}>{ACIDITY_LEVELS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="单宁"><select value={value.tannin} onChange={(event) => patch('tannin', event.target.value as TanninLevel)}>{TANNIN_LEVELS.map((item) => <option key={item}>{item}</option>)}</select></Field>
          </div>
          <Field label="醒酒 / 适饮备注"><textarea value={value.decantingNote} onChange={(event) => patch('decantingNote', event.target.value)} placeholder="例如 开瓶 30 分钟后更舒展，适合配牛排" /></Field>
        </>
      ) : value.type === 'cocktail' ? (
        <>
          <div className="form-grid">
            <Field label="基酒"><select value={value.baseSpirit} onChange={(event) => patch('baseSpirit', event.target.value as BaseSpirit)}>{BASE_SPIRITS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="杯型"><input value={value.glassware} onChange={(event) => patch('glassware', event.target.value)} placeholder="古典杯、Coupe、高球杯" /></Field>
          </div>
          <Field label="配方"><textarea value={value.recipe} onChange={(event) => patch('recipe', event.target.value)} placeholder="例如 金酒 30ml，甜味美思 30ml，Campari 30ml" /></Field>
          <Field label="做法"><textarea value={value.method} onChange={(event) => patch('method', event.target.value)} placeholder="搅拌、摇和、直调，记录关键步骤" /></Field>
          <div className="form-grid">
            <Field label="冰"><input value={value.ice} onChange={(event) => patch('ice', event.target.value)} placeholder="大冰、碎冰、无冰" /></Field>
            <Field label="装饰"><input value={value.garnish} onChange={(event) => patch('garnish', event.target.value)} placeholder="橙皮、柠檬片、樱桃" /></Field>
          </div>
          <label className="toggle-line">
            <input type="checkbox" checked={value.isHomemade} onChange={(event) => patch('isHomemade', event.target.checked)} />
            <span>这是我自己调的</span>
          </label>
        </>
      ) : (
        <>
          <div className="form-grid">
            <Field label="国家 / 地区"><input value={value.country} onChange={(event) => patch('country', event.target.value)} placeholder="中国、德国、日本、苏格兰" /></Field>
            <Field label="产区 / 地方"><input value={value.region} onChange={(event) => patch('region', event.target.value)} placeholder="青岛、茅台镇、艾雷岛、波本产区" /></Field>
          </div>
          <div className="form-grid">
            <Field label="风格 / 类型"><input value={value.style} onChange={(event) => patch('style', event.target.value)} placeholder={stylePlaceholder(value.type)} /></Field>
            <Field label="原料"><input value={value.originMaterial} onChange={(event) => patch('originMaterial', event.target.value)} placeholder={materialPlaceholder(value.type)} /></Field>
          </div>
          <Field label="陈年 / 工艺"><textarea value={value.agingNote} onChange={(event) => patch('agingNote', event.target.value)} placeholder={agingPlaceholder(value.type)} /></Field>
        </>
      )}

      <Field label="风味标签"><input value={value.flavorTags} onChange={(event) => patch('flavorTags', event.target.value)} placeholder="用逗号分隔，例如 樱桃，香料，清爽" /></Field>
      <div className="chip-row">
        {COMMON_FLAVOR_TAGS.map((tag) => (
          <button className="chip button-chip" type="button" key={tag} onClick={() => patch('flavorTags', mergeTag(value.flavorTags, tag))}>
            {tag}
          </button>
        ))}
      </div>

      <div className="form-grid">
        <Field label="购买 / 记录日期"><input type="date" value={value.purchaseDate} onChange={(event) => patch('purchaseDate', event.target.value)} /></Field>
        <Field label="价格"><input type="number" min="0" inputMode="decimal" value={value.price} onChange={(event) => patch('price', event.target.value)} placeholder="元" /></Field>
        <Field label="容量"><input type="number" min="0" inputMode="numeric" value={value.volumeMl} onChange={(event) => patch('volumeMl', event.target.value)} placeholder="ml" /></Field>
        <Field label="酒精度"><input type="number" min="0" step="0.1" inputMode="decimal" value={value.alcoholPercent} onChange={(event) => patch('alcoholPercent', event.target.value)} placeholder="%" /></Field>
      </div>
      <div className="form-grid">
        <Field label="来源"><select value={value.purchaseSource} onChange={(event) => patch('purchaseSource', event.target.value as PurchaseSource)}>{PURCHASE_SOURCES.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="链接"><input value={value.purchaseUrl} onChange={(event) => patch('purchaseUrl', event.target.value)} placeholder="购买链接或参考链接" /></Field>
      </div>
      <Field label="个人备注"><textarea value={value.notes} onChange={(event) => patch('notes', event.target.value)} placeholder="为什么想买、喝前期待、下次怎么调整" /></Field>
      <label className="toggle-line">
        <input type="checkbox" checked={value.wantAgain} onChange={(event) => patch('wantAgain', event.target.checked)} />
        <span>{value.type === 'cocktail' ? '想再调 / 再点' : '想复购'}</span>
      </label>
      <div className="action-row">
        <button className="primary-action" type="submit" disabled={isPhotoProcessing}>
          <Check size={18} />
          保存档案
        </button>
        {onCancel && <button className="secondary-action" type="button" onClick={onCancel}>取消</button>}
      </div>
    </form>
  );
}

interface LogFormValue {
  drinkId: string;
  date: string;
  scene: string;
  place: string;
  pairing: string;
  rating: string;
  aroma: string;
  palate: string;
  finish: string;
  notes: string;
}

function LogForm({ drinks, onSubmit }: { drinks: DrinkItem[]; onSubmit: (value: LogFormValue) => void }) {
  const [value, setValue] = useState<LogFormValue>({
    drinkId: drinks[0]?.id || '',
    date: todayInputValue(),
    scene: '',
    place: '',
    pairing: '',
    rating: '4',
    aroma: '3',
    palate: '3',
    finish: '3',
    notes: '',
  });

  const patch = <K extends keyof LogFormValue>(key: K, next: LogFormValue[K]) => setValue((current) => ({ ...current, [key]: next }));

  if (!drinks.length) {
    return <EmptyState title="先新增档案" body="饮用记录需要关联到一瓶酒或一杯鸡尾酒。" />;
  }

  return (
    <form
      className="form-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <h2>新增饮用</h2>
      <Field label="对象"><select value={value.drinkId} onChange={(event) => patch('drinkId', event.target.value)}>{drinks.map((drink) => <option key={drink.id} value={drink.id}>{drink.name}</option>)}</select></Field>
      <div className="form-grid">
        <Field label="日期"><input type="date" value={value.date} onChange={(event) => patch('date', event.target.value)} /></Field>
        <Field label="场景"><input list="scene-suggestions" value={value.scene} onChange={(event) => patch('scene', event.target.value)} placeholder="晚餐、酒吧、朋友聚会" /></Field>
      </div>
      <datalist id="scene-suggestions">
        {SCENE_SUGGESTIONS.map((scene) => <option key={scene} value={scene} />)}
      </datalist>
      <div className="form-grid">
        <Field label="地点"><input value={value.place} onChange={(event) => patch('place', event.target.value)} placeholder="家里、餐厅、酒吧" /></Field>
        <Field label="搭配"><input value={value.pairing} onChange={(event) => patch('pairing', event.target.value)} placeholder="牛排、甜点、空口" /></Field>
      </div>
      <SliderField label="总评分" value={value.rating} onChange={(next) => patch('rating', next)} min="1" max="5" step="0.1" />
      <div className="form-grid">
        <SliderField label="香气" value={value.aroma} onChange={(next) => patch('aroma', next)} />
        <SliderField label="口感" value={value.palate} onChange={(next) => patch('palate', next)} />
        <SliderField label="余味" value={value.finish} onChange={(next) => patch('finish', next)} />
      </div>
      <Field label="饮用笔记"><textarea value={value.notes} onChange={(event) => patch('notes', event.target.value)} placeholder="入口、温度变化、是否想复购或再调" /></Field>
      <button className="primary-action" type="submit">
        <Check size={18} />
        保存饮用
      </button>
    </form>
  );
}

function DrinkCard({ drink, onClick }: { drink: DrinkWithStats; onClick: () => void }) {
  return (
    <button className="drink-card" type="button" onClick={onClick}>
      <div className="drink-card-main">
        <DrinkPhoto drink={drink} className="drink-card-photo" />
        <div className="drink-card-copy">
          <p className="eyebrow">{drinkMeta(drink)}</p>
          <h3>{drink.name}</h3>
          <p className="item-meta">{drink.logs.length} 次饮用 · {drink.wantAgain ? '想再喝' : '未标记'}</p>
        </div>
      </div>
      <div className="chip-row">
        {drink.flavorTags.slice(0, 3).map((tag) => (
          <span className="chip" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <div className="card-footer">
        <span>{drink.lastDrankAt ? `最近 ${formatDate(drink.lastDrankAt)}` : '还没喝'}</span>
        <strong>{formatRating(drink.averageRating)}</strong>
      </div>
    </button>
  );
}

function DrinkScroller({ drinks, onOpenDrink, emptyText }: { drinks: DrinkWithStats[]; onOpenDrink: (id: string) => void; emptyText: string }) {
  if (!drinks.length) return <EmptyState title="暂无数据" body={emptyText} compact />;
  return (
    <div className="horizontal-list">
      {drinks.map((drink) => (
        <button className="mini-card" type="button" key={drink.id} onClick={() => onOpenDrink(drink.id)}>
          <DrinkPhoto drink={drink} className="mini-card-photo" />
          <span>{drink.name}</span>
          <strong>{formatRating(drink.averageRating)}</strong>
        </button>
      ))}
    </div>
  );
}

function DrinkPhoto({ drink, className }: { drink: Pick<DrinkItem, 'name' | 'photoDataUrl' | 'type'>; className: string }) {
  return drink.photoDataUrl ? (
    <img className={className} src={drink.photoDataUrl} alt={`${drink.name} 的照片`} loading="lazy" />
  ) : (
    <div className={`${className} photo-fallback`} aria-label="暂无照片">
      {drink.type === 'wine' ? <Wine size={18} /> : drink.type === 'beer' ? <Beer size={18} /> : <GlassWater size={18} />}
    </div>
  );
}

function RecommendationList({ recommendations }: { recommendations: ReturnType<typeof buildRecommendations> }) {
  return (
    <div className="recommendation-list">
      {recommendations.map((recommendation) => (
        <article className="recommendation-card" key={recommendation.id}>
          <p className="eyebrow">{recommendation.kind}</p>
          <h3>{recommendation.title}</h3>
          <p>{recommendation.reason}</p>
          <div className="chip-row">
            {recommendation.chips.map((chip) => (
              <span className="chip" key={chip}>
                {chip}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function SignalBlock({ title, signals }: { title: string; signals: ReturnType<typeof buildPreferenceProfile>['topCountries'] }) {
  return (
    <article className="signal-block">
      <h3>{title}</h3>
      {signals.length ? (
        signals.slice(0, 5).map((signal) => (
          <div className="signal-row" key={signal.label}>
            <span>{signal.label}</span>
            <div className="signal-meter">
              <span style={{ width: `${Math.min(100, signal.averageRating * 20)}%` }} />
            </div>
            <strong>{signal.averageRating.toFixed(1)}</strong>
          </div>
        ))
      ) : (
        <p className="subtle">记录变多后会自动生成。</p>
      )}
    </article>
  );
}

function RatingTrend({ logs }: { logs: DrinkLog[] }) {
  if (!logs.length) return <EmptyState title="暂无趋势" body="添加两次以上饮用会更有参考价值。" compact />;
  const chronological = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return (
    <div className="trend">
      {chronological.map((log) => (
        <div className="trend-bar" key={log.id}>
          <span style={{ height: `${Math.max(8, log.rating * 18)}%` }} />
          <small>{formatDate(log.date)}</small>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action && (
        <span>
          {action}
          <ChevronRight size={15} />
        </span>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min = '1',
  max = '5',
  step = '1',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="field slider-field">
      <span>
        {label} <strong>{value}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectPill({
  value,
  options,
  labels,
  onChange,
}: {
  value: string;
  options: string[];
  labels?: Partial<Record<string, string>>;
  onChange: (value: string) => void;
}) {
  return (
    <select className="select-pill" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option} value={option}>
          {labels?.[option] || option}
        </option>
      ))}
    </select>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={active ? 'active' : ''} type="button" onClick={onClick} aria-current={active ? 'page' : undefined}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function EmptyState({ title, body, compact }: { title: string; body: string; compact?: boolean }) {
  return (
    <div className={compact ? 'empty-state compact' : 'empty-state'}>
      <Sparkles size={compact ? 20 : 28} />
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function mergeTag(current: string, tag: string) {
  const tags = parseTags(current);
  if (!tags.includes(tag)) tags.push(tag);
  return tags.join('，');
}

function wineMeta(drink: DrinkItem) {
  return [drink.country, drink.region, drink.vintage, drink.wineColor].filter(Boolean).join(' · ') || '未记录产区';
}

function cocktailMeta(drink: DrinkItem) {
  return [drink.baseSpirit, drink.isHomemade ? '自调' : drink.producer].filter(Boolean).join(' · ') || '未记录基酒';
}

function generalDrinkMeta(drink: DrinkItem) {
  return [DRINK_TYPE_LABELS[drink.type], drink.style, drink.country, drink.region].filter(Boolean).join(' · ') || DRINK_TYPE_LABELS[drink.type];
}

function drinkMeta(drink: DrinkItem) {
  if (drink.type === 'wine') return wineMeta(drink);
  if (drink.type === 'cocktail') return cocktailMeta(drink);
  return generalDrinkMeta(drink);
}

function namePlaceholder(type: DrinkType) {
  const placeholders: Record<DrinkType, string> = {
    wine: '例如 勃艮第黑皮诺',
    cocktail: '例如 Negroni',
    beer: '例如 帝国世涛、IPA、修道院三料',
    baijiu: '例如 飞天茅台、普五、国窖1573',
    spirit: '例如 麦卡伦 12 年、山崎、轩尼诗 VSOP',
  };
  return placeholders[type];
}

function producerPlaceholder(type: DrinkType) {
  const placeholders: Record<DrinkType, string> = {
    wine: '例如 Domaine / 酒商',
    cocktail: '例如 自调、某家酒吧',
    beer: '例如 酿酒厂、品牌、酒吧',
    baijiu: '例如 酒厂、品牌、渠道',
    spirit: '例如 酒厂、装瓶商、品牌',
  };
  return placeholders[type];
}

function stylePlaceholder(type: DrinkType) {
  const placeholders: Record<DrinkType, string> = {
    wine: '',
    cocktail: '',
    beer: '例如 IPA、世涛、皮尔森、酸啤',
    baijiu: '例如 酱香、浓香、清香、兼香',
    spirit: '例如 单一麦芽、波本、干邑、朗姆',
  };
  return placeholders[type];
}

function materialPlaceholder(type: DrinkType) {
  const placeholders: Record<DrinkType, string> = {
    wine: '',
    cocktail: '',
    beer: '例如 麦芽、啤酒花、酵母、特殊辅料',
    baijiu: '例如 高粱、小麦、玉米、大曲',
    spirit: '例如 大麦、玉米、甘蔗、葡萄',
  };
  return placeholders[type];
}

function agingPlaceholder(type: DrinkType) {
  const placeholders: Record<DrinkType, string> = {
    wine: '',
    cocktail: '',
    beer: '例如 过桶、干投、发酵特点、适饮温度',
    baijiu: '例如 年份、轮次、勾调、开瓶变化',
    spirit: '例如 桶型、陈年年份、泥煤、过桶信息',
  };
  return placeholders[type];
}
