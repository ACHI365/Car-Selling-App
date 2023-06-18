export default interface Product {
    car_id: number;
    status_id: number;
    photo: string;
    pic_number: number;
    prod_year: number;
    man_id: number;
    car_model: string;
    price: number;
    price_usd: number;
    price_value: number;
    fuel_type_id: number;
    gear_type_id: number;
    drive_type_id: number;
    car_run: number;
    car_run_km: number;
    engine_volume: number;
    right_wheel: boolean;
    customs_passed: boolean;
    model_id: number;
    location_id: number;
    order_number: number;
    vehicle_type: number;
    category_id: number;
    car_desc: string;
    order_date: string;
    photo_ver: number;
    views: number;
    has_predicted_price: boolean;
    pred_first_breakpoint: number | null;
    pred_second_breakpoint: number | null;
}