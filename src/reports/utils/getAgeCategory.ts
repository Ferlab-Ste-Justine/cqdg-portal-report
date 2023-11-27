import getConfigGlobal from '../../config';

const getAgeCategory = (value: string): string => {
    const configGlobal = getConfigGlobal();
    const category = configGlobal.age_categories.find(e => e.key === value);
    return category ? `${category.label} (${category.tooltip})` : '';
};

export default getAgeCategory;
