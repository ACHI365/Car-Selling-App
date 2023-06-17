import React, { useEffect } from 'react';

import Category from "../models/Category";
import Manufacturer from "../models/Manufacturer";
import Model from "../models/Model";
import { Period } from "../models/Period";
import Product from "../models/Product";
import { RentType } from "../models/RentType";
import { CategoryType } from "../models/CategoryType";
import { ContextProps, StorageContextProps } from '../stores/ContextProps';
import { BargainType } from '../models/BargainType';

interface AbstractDictionary<V> {
    [key: number]: V;
} 

const URLS = {
    MANUFACTURERS: "https://static.my.ge/myauto/js/mans.json",
    MODELS: "https://api2.myauto.ge/en/getManModels?man_id=",
    CATEGORIES: "https://api2.myauto.ge/en/cats/get",
    PRODUCTS: "https://api2.myauto.ge/en/products"
}

const CategoryDescr : AbstractDictionary<Category> = {}; 
const ModelDescr : AbstractDictionary<Model> = {}; 
const ManufacturerDescr : AbstractDictionary<Manufacturer> = {}; 
const ManModelMap : AbstractDictionary<Model[]> = {}; 
const TypeManMap : AbstractDictionary<Manufacturer[]> = {};
const TypeCatMap : AbstractDictionary<Category[]> = {};

interface ProductResponse {
    items: Product[],
    meta: { 
        total: number,
        last_page: number
    },
}

const fetchCategories = async () => {
    const response = await fetch(URLS.CATEGORIES);
    const data = await response.json();
    data.data.forEach((cat: Category) => {
        if (!(CategoryDescr[cat.category_id])) {
            // Add to categories general list
            CategoryDescr[cat.category_id] = cat;
        }
        // Add to Type -> Cat map
        if (!(TypeCatMap[cat.category_type])) {
            TypeCatMap[cat.category_type] = [];
        }
        TypeCatMap[cat.category_type].push(cat);
    });
}

const fetchManufacturers = async () => {
    const response = await fetch(URLS.MANUFACTURERS);
    const data = await response.json();
    data.forEach((man: Manufacturer) => {
        const id : number = Number(man.man_id);
        if (!(ManufacturerDescr[id])) {
            // Add to manufacturers general list
            ManufacturerDescr[id] = man;
        }
        // Add to Type -> Man map
        const type = getManCategory(man).valueOf();
        if (!(TypeManMap[type])) {
            TypeManMap[type] = [];
        }
        TypeManMap[type].push(man);
        // Initialize in Cat -> Man map
        if (!(ManModelMap[id])) {
            ManModelMap[id] = [];
        }
    });
}

const fetchModels = async (manId: number) : Promise<Model[]> => {
    const response = await fetch(URLS.MODELS + manId);
    const data = await response.json();
    data.data.forEach((model: Model) => {
        if (!(ModelDescr[model.model_id])) {
            // Add to manufacturers general list
            ModelDescr[model.model_id] = model;
        }
        // Add to Man -> Model map
        if (!(ManModelMap[model.man_id])) {
            ManModelMap[model.man_id] = [];
        }
        ManModelMap[model.man_id].push(model);
    });
    return data.data;
}

const fetchProducts = async (manufacturers?: number[], models?: number[], categories?: number[],
                             priceFrom?: number, priceTo?: number, currency?: number, period?: Period,
                             bargain?: BargainType, rentTypes?: RentType[], sort?: number, page?: number) : Promise<ProductResponse> => {
    let filter : string = "?";
    let paramStr : string = "";
    if (manufacturers) {
        paramStr = "Mans="
        let paramMap : { [key: number]: number[] } = {};
        for (const manId of manufacturers) {
            paramMap[manId] = [];
            if (!ManModelMap[manId] || ManModelMap[manId].length == 0) {
                await fetchModels(manId);
            }
        }
        if (models) {
            for (const modelId of models) {
                const model = ModelDescr[modelId];
                if (model && paramMap[model.man_id]) {
                    paramMap[model.man_id].push(modelId);
                }
            }
        }
        for (const [key, value] of Object.entries(paramMap)) {
            paramStr += `${key}${value.length > 0 ? ('.' + value.join('.')) : ''}-`;
        }
        filter += paramStr.substring(0, paramStr.length - 1) + "&";
    }

    if (categories) {
        paramStr = `Cats=${categories.join('.')}` 
        filter += paramStr + "&";
    }

    if (priceFrom) {
        paramStr = 'PriceFrom=' + priceFrom;
        filter += paramStr + "&";
    }
    if (priceTo) {
        paramStr = 'PriceTo=' + priceTo;
        filter += paramStr + "&";
    }

    if (currency) {
        paramStr = 'CurrencyID=' + currency;
        filter += paramStr + "&";
    }

    if (period) {
        paramStr = `Period=${period.split(' ')[0]}h`
        filter += paramStr + "&";
    }

    if (bargain) {
        paramStr = "ForRent=" + (bargain.endsWith("sale") ? 0 : 1);
        filter += paramStr + "&";
    }

    if (rentTypes) {
        paramStr = "";
        for (const type of rentTypes) {
            paramStr += `Rent${Object.keys(RentType)[Object.values(RentType).indexOf(type)]}=1&`
        }
        filter += paramStr;
    }

    if (sort) {
        paramStr = "SortOrder=" + sort;
        filter += paramStr + "&";
    }

    if (page) {
        paramStr = "Page=" + page;
        filter += paramStr + "&";       
    }
    else {
        paramStr = "Page=1";
        filter += paramStr + "&";   
    }
    console.log(URLS.PRODUCTS + filter);
    const response = await fetch(URLS.PRODUCTS + filter);
    const data = await response.json();
    return data.data;
}

const getManCategory = (man : Manufacturer) : CategoryType => {
    return man.is_car == "1" ? CategoryType.Car : man.is_spec == "1" ? CategoryType.Special : CategoryType.Motorbike;
}

export const getCategories = (type: CategoryType) : Category[] => { 
   return getAllCategories().filter((cat: Category) => cat.category_type == type); 
};

export const getAllCategories = () : Category[] => { 
    return Object.values(CategoryDescr); 
};

export const getManufacturers = (type: CategoryType) : Manufacturer[] => {
     return getAllManufacturers().filter((man : Manufacturer) => getManCategory(man) == type); 
};

export const getAllManufacturers = (): Manufacturer[] => {
    return Object.values(ManufacturerDescr); 
};

export const getModels = async (manufacturerIds: number[], storage: StorageContextProps) : Promise<void> => {
    let models : Model[] = [];
    for (const id of manufacturerIds) {
        await fetchModels(id).then(newModels => models = [...models, ...newModels]);
    }
    storage.setModels(models);
};
export const getProducts = async (storage: StorageContextProps, manufacturers?: number[], models?: number[], categories?: number[],
              priceFrom?: number, priceTo?: number, currency?: number, period?: Period,
              bargain?: BargainType, rentTypes?: RentType[], sort?: number, page?: number) : Promise<void> => {
    let products : Product[] = [];
    let total : number = -1;
    let lastPage : number = -1;
    await fetchProducts(manufacturers, models, categories, priceFrom, priceTo, currency, period, bargain, rentTypes, sort, page)
        .then(newProducts => {
            products = [...newProducts.items];
            total = newProducts.meta.total;
            lastPage = newProducts.meta.last_page
        });
    storage.setProducts(products);
    storage.setTotalVehicles(total);
    storage.setLastPage(lastPage);
};

export const getAllProducts = (storage: StorageContextProps) : void => {
   getProducts(storage);
};

const CentralController = (props: ContextProps) => {
    // Initialize
    useEffect(() => {
        fetchCategories();
        fetchManufacturers();
    }, []);
    return <>{props.children}</>;
}

export default CentralController;