// =====================================================
// LOGISTICS CONTROL TOWER
// UNIFIED SCRIPT.JS
// =====================================================


// =====================================================
// API LINKS
// =====================================================

// -----------------------------------------------------
// SHEET 1
// بضاعة للشحن
// -----------------------------------------------------

const CARGO_API_URL =
    "https://script.google.com/macros/s/AKfycbzcOzKiEgDRY5gMXiJequUKefzrF1hPb8RnEmt8KzuN-XzuxJWbYhfX0nXf9oHgvTVqOA/exec";


// -----------------------------------------------------
// MODELS + CONTAINERS
// -----------------------------------------------------

const LOGISTICS_API_URL =
    "https://script.google.com/macros/s/AKfycbz9smxE0qdzc7tOBhXNYkIgRpMk7IrwK06fjE9C-qN30Zf-ttRiMEGWPUFRcIMZxrFqLg/exec";

const MODELS_API_URL =
    LOGISTICS_API_URL + "?sheet=MODELS";

const CONTAINERS_API_URL =
    LOGISTICS_API_URL + "?sheet=CONTAINERS";


// =====================================================
// DATA
// =====================================================

let cargoOrders = [];
let shipments = [];
let containers = [];
let uniqueContainers = [];


// =====================================================
// CHARTS
// =====================================================

let dashboardCargoFactoryChart = null;
let dashboardCargoStatusChart = null;

let cargoFactoryChart = null;
let cargoStatusChart = null;

let dashboardMonthChart = null;
let dashboardFactoryChart = null;

let shipmentsMonthChart = null;
let shipmentsFactoryChart = null;


// =====================================================
// HELPERS
// =====================================================

function getElement(id) {
    return document.getElementById(id);
}


function setText(id, value) {

    const element = getElement(id);

    if (element) {
        element.textContent = value;
    }
}


function text(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value);
}


function escapeHTML(value) {

    return text(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function normalize(value) {

    return text(value)
        .trim()
        .toLowerCase();
}


function number(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    if (typeof value === "number") {

        return Number.isFinite(value)
            ? value
            : 0;
    }

    let valueText =
        String(value)
            .trim()
            .replace(/,/g, "");

    const arabic =
        "٠١٢٣٤٥٦٧٨٩";

    const persian =
        "۰۱۲۳۴۵۶۷۸۹";

    valueText =
        valueText.replace(
            /[٠-٩]/g,
            function(char) {
                return arabic.indexOf(char);
            }
        );

    valueText =
        valueText.replace(
            /[۰-۹]/g,
            function(char) {
                return persian.indexOf(char);
            }
        );

    const result =
        Number(valueText);

    return Number.isFinite(result)
        ? result
        : 0;
}


function formatNumber(value) {

    return number(value)
        .toLocaleString("en-US");
}


function parseDate(value) {

    if (!value) {
        return null;
    }

    if (value instanceof Date) {

        if (isNaN(value.getTime())) {
            return null;
        }

        return value;
    }

    const valueText =
        String(value).trim();


    // YYYY-MM-DD
    let match =
        valueText.match(
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
        );

    if (match) {

        const date =
            new Date(
                Number(match[1]),
                Number(match[2]) - 1,
                Number(match[3])
            );

        return isNaN(date.getTime())
            ? null
            : date;
    }


    // DD-MM-YYYY
    match =
        valueText.match(
            /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/
        );

    if (match) {

        const date =
            new Date(
                Number(match[3]),
                Number(match[2]) - 1,
                Number(match[1])
            );

        return isNaN(date.getTime())
            ? null
            : date;
    }


    const date =
        new Date(value);

    return isNaN(date.getTime())
        ? null
        : date;
}


function formatDate(value) {

    const date =
        parseDate(value);

    if (!date) {
        return text(value);
    }

    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    return (
        String(date.getDate()).padStart(2, "0") +
        "-" +
        months[date.getMonth()] +
        "-" +
        date.getFullYear()
    );
}


function emptyRow(
    tbody,
    columns,
    message
) {

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="${columns}"
                style="text-align:center;">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}


// =====================================================
// API
// =====================================================

async function getJSON(url) {

    console.log("Loading:", url);

    const response =
        await fetch(
            url,
            {
                method: "GET",
                cache: "no-store"
            }
        );

    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );
    }

    const data =
        await response.json();

    console.log(
        "API response:",
        data
    );

    return data;
}


function getRows(data) {

    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        Array.isArray(data.data)
    ) {
        return data.data;
    }

    if (
        data &&
        Array.isArray(data.rows)
    ) {
        return data.rows;
    }

    if (
        data &&
        Array.isArray(data.result)
    ) {
        return data.result;
    }

    return [];
}


// =====================================================
// NORMALIZE CARGO / SHEET1
// =====================================================

function normalizeCargo(item) {

    return {

        po:
            text(
                item.po ??
                item.PO
            ),

        factory:
            text(
                item.factory ??
                item.Factory
            ),

        contact:
            text(
                item.contact ??
                item.Contact
            ),

        department:
            text(
                item.department ??
                item.Department
            ),

        model:
            text(
                item.model ??
                item.Model
            ),

        description:
            text(
                item.description ??
                item.Description
            ),

        qty:
            number(
                item.qty ??
                item.Qty
            ),

        qtyPerContainer:
            number(
                item.qtyPerContainer ??
                item.qty_per_container ??
                item["Qty per Container"]
            ),

        containers:
            number(
                item.containers ??
                item.Containers ??
                item.container
            ),

        loaded:
            number(
                item.loaded ??
                item.Loaded
            ),

        notLoaded:
            number(
                item.notLoaded ??
                item.not_loaded ??
                item["Not Loaded"]
            ),

        pol:
            text(
                item.pol ??
                item.POL
            ),

        pod:
            text(
                item.pod ??
                item.POD
            ),

        status:
            text(
                item.status ??
                item.Status
            )
    };
}


// =====================================================
// NORMALIZE MODELS
// =====================================================

function normalizeShipment(item) {

    return {

        entry:
            text(item.entry),

        hq:
            number(item.hq),

        factory:
            text(item.factory),

        description:
            text(item.description),

        model:
            text(item.model),

        qty:
            number(item.qty),

        etd:
            text(item.etd),

        eta:
            text(item.eta),

        pol:
            text(item.pol),

        pod:
            text(item.pod),

        bayan:
            text(item.bayan),

        department:
            text(item.department)
    };
}


// =====================================================
// NORMALIZE CONTAINERS
// =====================================================

function normalizeContainer(item) {

    return {

        entry:
            text(item.entry),

        department:
            text(item.department),

        sn:
            text(item.sn),

        container:
            text(item.container),

        model:
            text(item.model),

        qty:
            number(item.qty),

        distributionWarehouse:
            text(
                item.distributionWarehouse ??
                item.distribution_warehouse ??
                item.warehouse
            ),

        containerStatus:
            text(
                item.containerStatus ??
                item.container_status ??
                item.status
            ),

        transit1:
            text(item.transit1),

        eta1:
            text(item.eta1),

        departure1:
            text(item.departure1),

        transit2:
            text(item.transit2),

        eta2:
            text(item.eta2),

        departure2:
            text(item.departure2),

        transit3:
            text(item.transit3),

        eta3:
            text(item.eta3),

        departure3:
            text(item.departure3),

        transit4:
            text(item.transit4),

        eta4:
            text(item.eta4),

        departure4:
            text(item.departure4),

        transit5:
            text(item.transit5),

        eta5:
            text(item.eta5),

        departure5:
            text(item.departure5),

        pod:
            text(item.pod),

        eta:
            text(item.eta),

        customsDeclaration:
            text(
                item.customsDeclaration ??
                item.customs_declaration ??
                item.bayan
            ),

        factory:
            text(item.factory)
    };
}


// =====================================================
// LOAD CARGO
// SHEET1
// =====================================================

async function loadCargo() {

    try {

        const data =
            await getJSON(
                CARGO_API_URL
            );

        cargoOrders =
            getRows(data)
                .map(normalizeCargo);

        console.log(
            "CARGO:",
            cargoOrders
        );

        setupCargoFilters();

        renderCargo();

        updateCargoDashboard();

    }
    catch(error) {

        console.error(
            "CARGO ERROR:",
            error
        );

        cargoOrders = [];

        emptyRow(
            getElement("cargoTableBody"),
            14,
            "تعذر تحميل بيانات البضاعة للشحن"
        );
    }
}


// =====================================================
// LOAD MODELS
// =====================================================

async function loadModels() {

    try {

        const data =
            await getJSON(
                MODELS_API_URL
            );

        shipments =
            getRows(data)
                .map(normalizeShipment)
                .filter(
                    item =>
                        item.model !== ""
                );

        shipments.sort(
            function(a, b) {

                const dateA =
                    parseDate(a.eta);

                const dateB =
                    parseDate(b.eta);

                if (!dateA && !dateB) {
                    return 0;
                }

                if (!dateA) {
                    return 1;
                }

                if (!dateB) {
                    return -1;
                }

                return dateA - dateB;
            }
        );

        console.log(
            "MODELS:",
            shipments
        );

        setupShipmentFilters();

        renderShipments();

        updateShipmentDashboard();

    }
    catch(error) {

        console.error(
            "MODELS ERROR:",
            error
        );

        shipments = [];

        emptyRow(
            getElement(
                "shipmentsTableBody"
            ),
            11,
            "تعذر تحميل بيانات الشحنات"
        );
    }
}


// =====================================================
// LOAD CONTAINERS
// =====================================================

async function loadContainers() {

    try {

        const data =
            await getJSON(
                CONTAINERS_API_URL
            );

        containers =
            getRows(data)
                .map(normalizeContainer);

        uniqueContainers =
            uniqueContainerList(
                containers
            );

        console.log(
            "CONTAINERS:",
            containers
        );

        console.log(
            "UNIQUE:",
            uniqueContainers
        );

        setupContainerFilters();

        renderContainers();

        updateContainerKPIs();

        renderWarehouseSummary();

        updateShipmentDashboard();

    }
    catch(error) {

        console.error(
            "CONTAINERS ERROR:",
            error
        );

        containers = [];

        uniqueContainers = [];

        emptyRow(
            getElement(
                "containersTableBody"
            ),
            10,
            "تعذر تحميل بيانات الحاويات"
        );
    }
}


// =====================================================
// UNIQUE CONTAINERS
// =====================================================

function uniqueContainerList(data) {

    const map =
        new Map();

    data.forEach(
        function(item) {

            const key =
                normalize(
                    item.container
                );

            if (!key) {
                return;
            }

            if (!map.has(key)) {

                map.set(
                    key,
                    item
                );
            }
        }
    );

    return Array.from(
        map.values()
    );
}


// =====================================================
// CONTAINER STATUS
// =====================================================

function containerStatus(item) {

    const status =
        normalize(
            item.containerStatus
        );

    const customs =
        normalize(
            item.customsDeclaration
        );


    if (
        status === "مستلمة" ||
        status === "مستلم" ||
        status === "استلمت" ||
        status === "received" ||
        status === "receive"
    ) {

        return "received";
    }


    if (
        status === "" &&
        customs !== ""
    ) {

        return "broker";
    }


    if (
        status === "" &&
        customs === ""
    ) {

        return "sea";
    }


    return "other";
}


// =====================================================
// CURRENT TRANSIT
// =====================================================

function currentTransit(item) {

    let result = "";

    if (item.transit1) {
        result = item.transit1;
    }

    if (item.transit2) {
        result = item.transit2;
    }

    if (item.transit3) {
        result = item.transit3;
    }

    if (item.transit4) {
        result = item.transit4;
    }

    if (item.transit5) {
        result = item.transit5;
    }

    return result;
}


// =====================================================
// SELECT HELPER
// =====================================================

function fillSelect(
    id,
    values
) {

    const select =
        getElement(id);

    if (!select) {
        return;
    }

    const current =
        select.value;

    const list =
        [...new Set(
            values
                .map(text)
                .map(
                    value =>
                        value.trim()
                )
                .filter(
                    value =>
                        value !== ""
                )
        )];

    list.sort(
        function(a, b) {

            return a.localeCompare(
                b,
                "ar",
                {
                    numeric: true
                }
            );
        }
    );

    const firstOption =
        select.options[0]
            ? select.options[0].textContent
            : "الكل";

    select.innerHTML = "";

    const first =
        document.createElement(
            "option"
        );

    first.value = "";

    first.textContent =
        firstOption;

    select.appendChild(first);

    list.forEach(
        function(value) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                value;

            option.textContent =
                value;

            select.appendChild(option);
        }
    );

    if (
        list.includes(current)
    ) {
        select.value = current;
    }
}


// =====================================================
// CARGO FILTERS
// =====================================================

function setupCargoFilters() {

    fillSelect(
        "cargoDepartmentFilter",
        cargoOrders.map(
            item =>
                item.department
        )
    );

    fillSelect(
        "cargoFactoryFilter",
        cargoOrders.map(
            item =>
                item.factory
        )
    );

    fillSelect(
        "cargoPolFilter",
        cargoOrders.map(
            item =>
                item.pol
        )
    );

    fillSelect(
        "cargoPodFilter",
        cargoOrders.map(
            item =>
                item.pod
        )
    );
}


// =====================================================
// SHIPMENT FILTERS
// =====================================================

function setupShipmentFilters() {

    fillSelect(
        "shipmentsDepartmentFilter",
        shipments.map(
            item =>
                item.department
        )
    );

    fillSelect(
        "shipmentsFactoryFilter",
        shipments.map(
            item =>
                item.factory
        )
    );

    fillSelect(
        "shipmentsPolFilter",
        shipments.map(
            item =>
                item.pol
        )
    );

    fillSelect(
        "shipmentsPodFilter",
        shipments.map(
            item =>
                item.pod
        )
    );
}


// =====================================================
// CONTAINER FILTERS
// =====================================================

function setupContainerFilters() {

    fillSelect(
        "containersDepartmentFilter",
        uniqueContainers.map(
            item =>
                item.department
        )
    );

    fillSelect(
        "containersTransitFilter",
        uniqueContainers.map(
            item =>
                currentTransit(item)
        )
    );

    fillSelect(
        "containersWarehouseFilter",
        uniqueContainers.map(
            item =>
                item.distributionWarehouse
        )
    );
}


// =====================================================
// FILTER CARGO
// =====================================================

function getFilteredCargo() {

    const search =
        normalize(
            getElement(
                "cargoSearchInput"
            )?.value
        );

    const department =
        normalize(
            getElement(
                "cargoDepartmentFilter"
            )?.value
        );

    const factory =
        normalize(
            getElement(
                "cargoFactoryFilter"
            )?.value
        );

    const status =
        normalize(
            getElement(
                "cargoStatusFilter"
            )?.value
        );

    const loading =
        normalize(
            getElement(
                "cargoLoadingFilter"
            )?.value
        );

    const pol =
        normalize(
            getElement(
                "cargoPolFilter"
            )?.value
        );

    const pod =
        normalize(
            getElement(
                "cargoPodFilter"
            )?.value
        );


    return cargoOrders.filter(
        function(item) {

            const searchable = [
                item.po,
                item.factory,
                item.contact,
                item.department,
                item.model,
                item.description,
                item.pol,
                item.pod,
                item.status
            ]
                .join(" ")
                .toLowerCase();


            if (
                search &&
                !searchable.includes(search)
            ) {
                return false;
            }


            if (
                department &&
                normalize(item.department) !==
                department
            ) {
                return false;
            }


            if (
                factory &&
                normalize(item.factory) !==
                factory
            ) {
                return false;
            }


            if (
                status &&
                normalize(item.status) !==
                status
            ) {
                return false;
            }


            if (
                loading === "zero" &&
                number(item.notLoaded) !== 0
            ) {
                return false;
            }


            if (
                loading === "greaterthanzero" &&
                number(item.notLoaded) <= 0
            ) {
                return false;
            }


            if (
                pol &&
                normalize(item.pol) !==
                pol
            ) {
                return false;
            }


            if (
                pod &&
                normalize(item.pod) !==
                pod
            ) {
                return false;
            }


            return true;
        }
    );
}


// =====================================================
// FILTER SHIPMENTS
// =====================================================

function getFilteredShipments() {

    const search =
        normalize(
            getElement(
                "shipmentsSearchInput"
            )?.value
        );

    const department =
        normalize(
            getElement(
                "shipmentsDepartmentFilter"
            )?.value
        );

    const factory =
        normalize(
            getElement(
                "shipmentsFactoryFilter"
            )?.value
        );

    const pol =
        normalize(
            getElement(
                "shipmentsPolFilter"
            )?.value
        );

    const pod =
        normalize(
            getElement(
                "shipmentsPodFilter"
            )?.value
        );


    return shipments.filter(
        function(item) {

            const searchable = [
                item.entry,
                item.factory,
                item.description,
                item.model,
                item.qty,
                item.etd,
                item.eta,
                item.pol,
                item.pod,
                item.department
            ]
                .join(" ")
                .toLowerCase();


            if (
                search &&
                !searchable.includes(search)
            ) {
                return false;
            }


            if (
                department &&
                normalize(item.department) !==
                department
            ) {
                return false;
            }


            if (
                factory &&
                normalize(item.factory) !==
                factory
            ) {
                return false;
            }


            if (
                pol &&
                normalize(item.pol) !==
                pol
            ) {
                return false;
            }


            if (
                pod &&
                normalize(item.pod) !==
                pod
            ) {
                return false;
            }


            return true;
        }
    );
}


// =====================================================
// FILTER CONTAINERS
// =====================================================

function getFilteredContainers() {

    const search =
        normalize(
            getElement(
                "containersSearchInput"
            )?.value
        );

    const department =
        normalize(
            getElement(
                "containersDepartmentFilter"
            )?.value
        );

    const transit =
        normalize(
            getElement(
                "containersTransitFilter"
            )?.value
        );

    const warehouse =
        normalize(
            getElement(
                "containersWarehouseFilter"
            )?.value
        );

    const status =
        normalize(
            getElement(
                "containersStatusFilter"
            )?.value
        );


    return uniqueContainers.filter(
        function(item) {

            const searchable = [
                item.entry,
                item.department,
                item.sn,
                item.container,
                item.model,
                item.factory,
                item.distributionWarehouse,
                item.containerStatus,
                item.customsDeclaration,
                item.pod,
                item.transit1,
                item.transit2,
                item.transit3,
                item.transit4,
                item.transit5
            ]
                .join(" ")
                .toLowerCase();


            if (
                search &&
                !searchable.includes(search)
            ) {
                return false;
            }


            if (
                department &&
                normalize(item.department) !==
                department
            ) {
                return false;
            }


            if (
                transit &&
                normalize(
                    currentTransit(item)
                ) !==
                transit
            ) {
                return false;
            }


            if (
                warehouse &&
                normalize(
                    item.distributionWarehouse
                ) !==
                warehouse
            ) {
                return false;
            }


            if (status) {

                const calculatedStatus =
                    containerStatus(item);

                if (
                    calculatedStatus !==
                    status
                ) {
                    return false;
                }
            }


            return true;
        }
    );
}


// =====================================================
// RENDER CARGO
// =====================================================

function renderCargo() {

    const tbody =
        getElement(
            "cargoTableBody"
        );

    if (!tbody) {
        return;
    }

    const data =
        getFilteredCargo();


    if (!data.length) {

        emptyRow(
            tbody,
            14,
            "لا توجد بيانات مطابقة"
        );

        setText(
            "cargoResultCount",
            "عدد النتائج: 0"
        );

        return;
    }


    tbody.innerHTML =
        data.map(
            function(item) {

                const loadingStatus =
                    number(item.notLoaded) === 0
                        ? "تم التحميل"
                        : "لم يتم التحميل";

                return `
                    <tr>

                        <td>
                            ${escapeHTML(item.po)}
                        </td>

                        <td>
                            ${escapeHTML(item.factory)}
                        </td>

                        <td>
                            ${escapeHTML(item.contact)}
                        </td>

                        <td>
                            ${escapeHTML(item.department)}
                        </td>

                        <td>
                            ${escapeHTML(item.description)}
                        </td>

                        <td>
                           ${escapeHTML(item.model)}
                        </td>

                        <td>
                            ${formatNumber(item.qty)}
                        </td>

                        <td>
                            ${formatNumber(item.qtyPerContainer)}
                        </td>

                        <td>
                            ${formatNumber(item.containers)}
                        </td>

                        <td>
                            ${formatNumber(item.loaded)}
                        </td>

                        <td>
                            ${formatNumber(item.notLoaded)}
                        </td>

                        <td>
                            ${escapeHTML(item.pol)}
                        </td>

                        <td>
                            ${escapeHTML(item.pod)}
                        </td>

                        <td>
                            ${escapeHTML(item.status)}
                        </td>

                    </tr>
                `;
            }
        )
        .join("");


    setText(
        "cargoResultCount",
        `عدد النتائج: ${formatNumber(data.length)}`
    );
}


// =====================================================
// RENDER SHIPMENTS
// =====================================================

function renderShipments() {

    const tbody =
        getElement(
            "shipmentsTableBody"
        );

    if (!tbody) {
        return;
    }

    const data =
        getFilteredShipments();


    if (!data.length) {

        emptyRow(
            tbody,
            11,
            "لا توجد بيانات مطابقة"
        );

        setText(
            "shipmentsResultCount",
            "عدد الشحنات: 0"
        );

        updateShipmentPageKPIs(data);
        updateShipmentPageCharts(data);

        return;
    }


    tbody.innerHTML =
        data.map(
            function(item) {

                return `
                    <tr>

                        <td>
                            ${escapeHTML(item.entry)}
                        </td>

                        <td>
                            ${formatNumber(item.hq)}
                        </td>

                        <td>
                            ${escapeHTML(item.factory)}
                        </td>

                        <td>
                            ${escapeHTML(item.description)}
                        </td>

                        <td>
                            ${escapeHTML(item.model)}
                        </td>

                        <td>
                            ${formatNumber(item.qty)}
                        </td>

                        <td>
                            ${formatDate(item.etd)}
                        </td>

                        <td>
                            ${formatDate(item.eta)}
                        </td>

                        <td>
                            ${escapeHTML(item.pol)}
                        </td>

                        <td>
                            ${escapeHTML(item.pod)}
                        </td>

                        <td>
                            ${escapeHTML(item.department)}
                        </td>

                    </tr>
                `;
            }
        )
        .join("");


    setText(
        "shipmentsResultCount",
        `عدد الشحنات: ${formatNumber(data.length)}`
    );


    updateShipmentPageKPIs(data);

    updateShipmentPageCharts(data);
}


// =====================================================
// RENDER CONTAINERS
// =====================================================

function renderContainers() {

    const tbody =
        getElement(
            "containersTableBody"
        );

    if (!tbody) {
        return;
    }

    const data =
        getFilteredContainers();


    if (!data.length) {

        emptyRow(
            tbody,
            10,
            "لا توجد بيانات مطابقة"
        );

        setText(
            "containersResultCount",
            "عدد الحاويات: 0"
        );

        return;
    }


    tbody.innerHTML =
        data.map(
            function(item) {

                const currentTransit =
                    getCurrentTransit(item);

                return `
                    <tr>

                        <td>
                            ${escapeHTML(item.entry)}
                        </td>

                        <td>
                            ${escapeHTML(item.department)}
                        </td>

                        <td>
                            ${escapeHTML(item.sn)}
                        </td>

                        <td>
                            ${escapeHTML(item.container)}
                        </td>

                        <td class="model-cell">
                            ${escapeHTML(item.model)}
                        </td>

                        <td>
                            ${formatNumber(item.qty)}
                        </td>

                        <td>
                            ${escapeHTML(currentTransit)}
                        </td>

                        <td>
                            ${escapeHTML(
                                item.distributionWarehouse
                            )}
                        </td>

                        <td>
                            ${escapeHTML(item.pod)}
                        </td>

                        <td>
                            ${formatDate(item.eta)}
                        </td>

                    </tr>
                `;
            }
        )
        .join("");


    setText(
        "containersResultCount",
        `عدد الحاويات: ${formatNumber(data.length)}`
    );
}


// =====================================================
// CONTAINER KPIs
// =====================================================

function updateContainerKPIs() {

    const data =
        uniqueContainers;


    const total =
        data.length;


    let received = 0;

    let broker = 0;

    let sea = 0;


    data.forEach(
        function(item) {

            const status =
                containerStatus(item);

            if (status === "received") {

                received++;

            }
            else if (status === "broker") {

                broker++;

            }
            else if (status === "sea") {

                sea++;
            }
        }
    );


    setText(
        "containersTotal",
        formatNumber(total)
    );

    setText(
        "containersOnSea",
        formatNumber(sea)
    );

    setText(
        "containersBroker",
        formatNumber(broker)
    );

    setText(
        "containersReceived",
        formatNumber(received)
    );
}


// =====================================================
// WAREHOUSE SUMMARY
// =====================================================

function renderWarehouseSummary() {

    const container =
        getElement(
            "warehouseList"
        );

    if (!container) {
        return;
    }


    const received =
        uniqueContainers.filter(
            function(item) {

                return containerStatus(item) ===
                    "received";
            }
        );


    setText(
        "warehouseTotalReceived",
        formatNumber(received.length)
    );


    const warehouses = {};

    received.forEach(
        function(item) {

            const warehouse =
                item.distributionWarehouse ||
                "غير محدد";

            if (!warehouses[warehouse]) {

                warehouses[warehouse] = 0;
            }

            warehouses[warehouse]++;
        }
    );


    const entries =
        Object.entries(
            warehouses
        );


    entries.sort(
        function(a, b) {

            return b[1] - a[1];
        }
    );


    if (!entries.length) {

        container.innerHTML =
            `
                <div class="empty-state">
                    لا توجد حاويات مستلمة
                </div>
            `;

        return;
    }


    container.innerHTML =
        entries.map(
            function(entry) {

                return `
                    <div class="warehouse-item">

                        <span>
                            ${escapeHTML(entry[0])}
                        </span>

                        <strong>
                            ${formatNumber(entry[1])}
                        </strong>

                    </div>
                `;
            }
        )
        .join("");
}


// =====================================================
// CARGO DASHBOARD
// =====================================================

function updateCargoDashboard() {

    const data =
        getFilteredCargo();


    let totalOrders =
        data.length;


    let totalQty =
        0;


    let totalContainers =
        0;


    let loaded =
        0;


    let notLoaded =
        0;


    data.forEach(
        function(item) {

            totalQty +=
                number(item.qty);

            totalContainers +=
                number(item.containers);

            loaded +=
                number(item.loaded);

            notLoaded +=
                number(item.notLoaded);
        }
    );


    setText(
        "cargoTotalOrders",
        formatNumber(totalOrders)
    );

    setText(
        "cargoTotalQty",
        formatNumber(totalQty)
    );

    setText(
        "cargoTotalContainers",
        formatNumber(totalContainers)
    );

    setText(
        "cargoLoaded",
        formatNumber(loaded)
    );

    setText(
        "cargoNotLoaded",
        formatNumber(notLoaded)
    );

    // تحديث KPIs الخاصة بصفحة "بضاعة للشحن"
setText(
    "cargoPageTotalOrders",
    formatNumber(totalOrders)
);

setText(
    "cargoPageTotalQty",
    formatNumber(totalQty)
);

setText(
    "cargoPageTotalContainers",
    formatNumber(totalContainers)
);

setText(
    "cargoPageLoaded",
    formatNumber(loaded)
);

setText(
    "cargoPageNotLoaded",
    formatNumber(notLoaded)
);


    drawCargoFactoryChart(data);

    drawCargoStatusChart(data);

    drawDashboardCargoFactoryChart(data);

    drawDashboardCargoStatusChart(data);
}


// =====================================================
// SHIPMENT DASHBOARD
// =====================================================

function updateShipmentDashboard() {

    const data =
        getFilteredShipments();


    const totalShipments =
        data.length;


    let totalContainers =
        0;


    data.forEach(
        function(item) {

            totalContainers +=
                number(item.hq);
        }
    );


    let received =
        0;


    let onSea =
        0;


    /*
     * الحاويات يتم حسابها من CONTAINERS
     * وليس من MODELS
     */


    if (uniqueContainers.length) {

        uniqueContainers.forEach(
            function(item) {

                const status =
                    containerStatus(item);

                if (
                    status === "received"
                ) {

                    received++;
                }

                if (
                    status === "sea"
                ) {

                    onSea++;
                }
            }
        );
    }


    setText(
        "dashboardTotalShipments",
        formatNumber(totalShipments)
    );

    setText(
        "dashboardTotalContainers",
        formatNumber(totalContainers)
    );

    setText(
        "dashboardContainersReceived",
        formatNumber(received)
    );

    setText(
        "dashboardContainersOnSea",
        formatNumber(onSea)
    );


    drawDashboardMonthChart(data);

    drawDashboardFactoryChart(data);
}


// =====================================================
// SHIPMENT PAGE KPIs
// =====================================================

function updateShipmentPageKPIs(data) {

    let containersTotal =
        0;


    data.forEach(
        function(item) {

            containersTotal +=
                number(item.hq);
        }
    );


    let received =
        0;


    let onSea =
        0;


    /*
     * الحاويات مرتبطة بفلترة الصفحة
     * حسب Entry / Department / Factory / POL / POD
     */

    const filteredEntries =
        new Set(
            data.map(
                item =>
                    normalize(item.entry)
            )
        );


    uniqueContainers.forEach(
        function(item) {

            const entry =
                normalize(item.entry);

            if (
                filteredEntries.size &&
                !filteredEntries.has(entry)
            ) {
                return;
            }


            const status =
                containerStatus(item);


            if (
                status === "received"
            ) {

                received++;
            }


            if (
                status === "sea"
            ) {

                onSea++;
            }
        }
    );


    setText(
        "shipmentsTotal",
        formatNumber(data.length)
    );

    setText(
        "shipmentsContainers",
        formatNumber(containersTotal)
    );

    setText(
        "shipmentsReceived",
        formatNumber(received)
    );

    setText(
        "shipmentsOnSea",
        formatNumber(onSea)
    );
}


// =====================================================
// CHART HELPERS
// =====================================================

function destroyChart(chart) {

    if (chart) {

        try {
            chart.destroy();
        }
        catch(error) {
            console.warn(
                "Chart destroy error:",
                error
            );
        }
    }
}


// =====================================================
// CARGO FACTORY CHART
// =====================================================

function drawCargoFactoryChart(data) {

    const canvas =
        getElement(
            "cargoFactoryChart"
        );

    if (!canvas || typeof Chart === "undefined") {
        return;
    }


    const factories = {};


    data.forEach(
        function(item) {

            const factory =
                item.factory ||
                "غير محدد";


            if (!factories[factory]) {

                factories[factory] = {
                    qty: 0,
                    containers: 0
                };
            }


            factories[factory].qty +=
                number(item.qty);


            factories[factory].containers +=
                number(item.containers);
        }
    );


    const sorted =
        Object.entries(
            factories
        )
        .sort(
            function(a, b) {

                return b[1].qty -
                    a[1].qty;
            }
        )
        .slice(0, 3);


    const labels =
        sorted.map(
            item =>
                item[0]
        );


    const qty =
        sorted.map(
            item =>
                item[1].qty
        );


    const containersData =
        sorted.map(
            item =>
                item[1].containers
        );


    destroyChart(
        cargoFactoryChart
    );


    cargoFactoryChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label: "الكمية",
                            data: qty
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        const index =
                                            context.dataIndex;

                                        return [
                                            "الكمية: " +
                                            formatNumber(
                                                qty[index]
                                            ),

                                            "الحاويات: " +
                                            formatNumber(
                                                containersData[index]
                                            )
                                        ];
                                    }
                            }
                        }
                    },

                    scales: {

                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
}


// =====================================================
// CARGO STATUS CHART
// =====================================================

function drawCargoStatusChart(data) {

    const canvas =
        getElement(
            "cargoStatusChart"
        );

    if (!canvas || typeof Chart === "undefined") {
        return;
    }


    const statuses = {};


    data.forEach(
        function(item) {

            const status =
                item.status ||
                "غير محدد";


            if (!statuses[status]) {

                statuses[status] = {
                    records: 0,
                    containers: 0
                };
            }


            statuses[status].records++;


            statuses[status].containers +=
                number(item.containers);
        }
    );


    const entries =
        Object.entries(
            statuses
        );


    const labels =
        entries.map(
            item =>
                item[0]
        );


    const records =
        entries.map(
            item =>
                item[1].records
        );


    const containersData =
        entries.map(
            item =>
                item[1].containers
        );


    destroyChart(
        cargoStatusChart
    );


    cargoStatusChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label: "السجلات",
                            data: records
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        const index =
                                            context.dataIndex;

                                        return [
                                            "السجلات: " +
                                            formatNumber(
                                                records[index]
                                            ),

                                            "الحاويات: " +
                                            formatNumber(
                                                containersData[index]
                                            )
                                        ];
                                    }
                            }
                        }
                    },

                    scales: {

                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
}


// =====================================================
// DASHBOARD CARGO FACTORY CHART
// =====================================================

function drawDashboardCargoFactoryChart(data) {

    const canvas =
        getElement(
            "dashboardCargoFactoryChart"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    const factories = {};


    data.forEach(
        function(item) {

            const factory =
                item.factory ||
                "غير محدد";


            if (!factories[factory]) {

                factories[factory] = {
                    qty: 0,
                    containers: 0
                };
            }


            factories[factory].qty +=
                number(item.qty);


            factories[factory].containers +=
                number(item.containers);
        }
    );


    const sorted =
        Object.entries(
            factories
        )
        .sort(
            function(a, b) {

                return b[1].qty -
                    a[1].qty;
            }
        )
        .slice(0, 3);


    const labels =
        sorted.map(
            item =>
                item[0]
        );


    const qty =
        sorted.map(
            item =>
                item[1].qty
        );


    const containersData =
        sorted.map(
            item =>
                item[1].containers
        );


    destroyChart(
        dashboardCargoFactoryChart
    );


    dashboardCargoFactoryChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label: "الكمية",
                            data: qty
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        const index =
                                            context.dataIndex;

                                        return [
                                            "الكمية: " +
                                            formatNumber(
                                                qty[index]
                                            ),

                                            "الحاويات: " +
                                            formatNumber(
                                                containersData[index]
                                            )
                                        ];
                                    }
                            }
                        }
                    },

                    scales: {

                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
}


// =====================================================
// DASHBOARD CARGO STATUS CHART
// =====================================================

function drawDashboardCargoStatusChart(data) {

    const canvas =
        getElement(
            "dashboardCargoStatusChart"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    const statuses = {};


    data.forEach(
        function(item) {

            const status =
                item.status ||
                "غير محدد";


            if (!statuses[status]) {

                statuses[status] = {
                    records: 0,
                    containers: 0
                };
            }


            statuses[status].records++;


            statuses[status].containers +=
                number(item.containers);
        }
    );


    const entries =
        Object.entries(
            statuses
        );


    const labels =
        entries.map(
            item =>
                item[0]
        );


    const records =
        entries.map(
            item =>
                item[1].records
        );


    const containersData =
        entries.map(
            item =>
                item[1].containers
        );


    destroyChart(
        dashboardCargoStatusChart
    );


    dashboardCargoStatusChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label: "السجلات",
                            data: records
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        const index =
                                            context.dataIndex;

                                        return [
                                            "السجلات: " +
                                            formatNumber(
                                                records[index]
                                            ),

                                            "الحاويات: " +
                                            formatNumber(
                                                containersData[index]
                                            )
                                        ];
                                    }
                            }
                        }
                    },

                    scales: {

                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
}


// =====================================================
// DASHBOARD MONTH CHART
// =====================================================

function drawDashboardMonthChart(data) {

    const canvas =
        getElement(
            "dashboardMonthChart"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];


    const shipmentsTotals =
        new Array(12).fill(0);


    const containerTotals =
        new Array(12).fill(0);


    data.forEach(
        function(item) {

            const date =
                parseDate(item.eta);


            if (!date) {
                return;
            }


            const month =
                date.getMonth();


            shipmentsTotals[month]++;


            containerTotals[month] +=
                number(item.hq);
        }
    );


    destroyChart(
        dashboardMonthChart
    );


    dashboardMonthChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: months,

                    datasets: [
                        {
                            label: "الحاويات",
                            data: containerTotals
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        const index =
                                            context.dataIndex;

                                        return [
                                            "الحاويات: " +
                                            formatNumber(
                                                containerTotals[index]
                                            ),

                                            "الشحنات: " +
                                            formatNumber(
                                                shipmentsTotals[index]
                                            )
                                        ];
                                    }
                            }
                        }
                    },

                    scales: {

                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
}


// =====================================================
// DASHBOARD FACTORY CHART
// =====================================================

function drawDashboardFactoryChart(data) {

    const canvas =
        getElement(
            "dashboardFactoryChart"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    const factories = {};


    data.forEach(
        function(item) {

            const factory =
                item.factory ||
                "غير محدد";


            if (!factories[factory]) {

                factories[factory] = {
                    shipments: 0,
                    containers: 0
                };
            }


            factories[factory].shipments++;


            factories[factory].containers +=
                number(item.hq);
        }
    );


    const sorted =
        Object.entries(
            factories
        )
        .sort(
            function(a, b) {

                return b[1].shipments -
                    a[1].shipments;
            }
        )
        .slice(0, 3);


    const labels =
        sorted.map(
            item =>
                item[0]
        );


    const shipmentsData =
        sorted.map(
            item =>
                item[1].shipments
        );


    const containersData =
        sorted.map(
            item =>
                item[1].containers
        );


    destroyChart(
        dashboardFactoryChart
    );


    dashboardFactoryChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label: "الشحنات",
                            data: shipmentsData
                        }
                    ]
                },

                options: {

                    indexAxis: "y",

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        const index =
                                            context.dataIndex;

                                        return [
                                            "الشحنات: " +
                                            formatNumber(
                                                shipmentsData[index]
                                            ),

                                            "الحاويات: " +
                                            formatNumber(
                                                containersData[index]
                                            )
                                        ];
                                    }
                            }
                        }
                    },

                    scales: {

                        x: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
}


// =====================================================
// SHIPMENTS PAGE MONTH CHART
// =====================================================

function updateShipmentPageCharts(data) {

    drawShipmentsMonthChart(data);

    drawShipmentsFactoryChart(data);
}


function drawShipmentsMonthChart(data) {

    const canvas =
        getElement(
            "shipmentsMonthChart"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];


    const shipmentTotals =
        new Array(12).fill(0);


    const containerTotals =
        new Array(12).fill(0);


    data.forEach(
        function(item) {

            const date =
                parseDate(item.eta);


            if (!date) {
                return;
            }


            const month =
                date.getMonth();


            shipmentTotals[month]++;


            containerTotals[month] +=
                number(item.hq);
        }
    );


    destroyChart(
        shipmentsMonthChart
    );


    shipmentsMonthChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: months,

                    datasets: [
                        {
                            label: "الحاويات",
                            data: containerTotals
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        const index =
                                            context.dataIndex;

                                        return [
                                            "الحاويات: " +
                                            formatNumber(
                                                containerTotals[index]
                                            ),

                                            "الشحنات: " +
                                            formatNumber(
                                                shipmentTotals[index]
                                            )
                                        ];
                                    }
                            }
                        }
                    },

                    scales: {

                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
}


// =====================================================
// SHIPMENTS PAGE FACTORY CHART
// =====================================================

function drawShipmentsFactoryChart(data) {

    const canvas =
        getElement(
            "shipmentsFactoryChart"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    const factories = {};


    data.forEach(
        function(item) {

            const factory =
                item.factory ||
                "غير محدد";


            if (!factories[factory]) {

                factories[factory] = {
                    shipments: 0,
                    containers: 0
                };
            }


            factories[factory].shipments++;


            factories[factory].containers +=
                number(item.hq);
        }
    );


    const sorted =
        Object.entries(
            factories
        )
        .sort(
            function(a, b) {

                return b[1].shipments -
                    a[1].shipments;
            }
        )
        .slice(0, 3);


    const labels =
        sorted.map(
            item =>
                item[0]
        );


    const shipmentsData =
        sorted.map(
            item =>
                item[1].shipments
        );


    const containersData =
        sorted.map(
            item =>
                item[1].containers
        );


    destroyChart(
        shipmentsFactoryChart
    );


    shipmentsFactoryChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label: "الشحنات",
                            data: shipmentsData
                        }
                    ]
                },

                options: {

                    indexAxis: "y",

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        const index =
                                            context.dataIndex;

                                        return [
                                            "الشحنات: " +
                                            formatNumber(
                                                shipmentsData[index]
                                            ),

                                            "الحاويات: " +
                                            formatNumber(
                                                containersData[index]
                                            )
                                        ];
                                    }
                            }
                        }
                    },

                    scales: {

                        x: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );
}


// =====================================================
// EVENT HANDLERS
// =====================================================

function attachFilterEvents() {

    const cargoInputs = [

        "cargoSearchInput",
        "cargoDepartmentFilter",
        "cargoFactoryFilter",
        "cargoStatusFilter",
        "cargoLoadingFilter",
        "cargoPolFilter",
        "cargoPodFilter"

    ];


    cargoInputs.forEach(
        function(id) {

            const element =
                getElement(id);

            if (!element) {
                return;
            }

            element.addEventListener(
                "input",
                function() {

                    renderCargo();

                    updateCargoDashboard();
                }
            );

            element.addEventListener(
                "change",
                function() {

                    renderCargo();

                    updateCargoDashboard();
                }
            );
        }
    );


    const shipmentInputs = [

        "shipmentsSearchInput",
        "shipmentsDepartmentFilter",
        "shipmentsFactoryFilter",
        "shipmentsPolFilter",
        "shipmentsPodFilter"

    ];


    shipmentInputs.forEach(
        function(id) {

            const element =
                getElement(id);

            if (!element) {
                return;
            }

            element.addEventListener(
                "input",
                function() {

                    renderShipments();

                    updateShipmentDashboard();
                }
            );

            element.addEventListener(
                "change",
                function() {

                    renderShipments();

                    updateShipmentDashboard();
                }
            );
        }
    );


    const containerInputs = [

        "containersSearchInput",
        "containersDepartmentFilter",
        "containersTransitFilter",
        "containersWarehouseFilter",
        "containersStatusFilter"

    ];


    containerInputs.forEach(
        function(id) {

            const element =
                getElement(id);

            if (!element) {
                return;
            }

            element.addEventListener(
                "input",
                function() {

                    renderContainers();

                    updateContainerKPIs();

                    renderWarehouseSummary();
                }
            );

            element.addEventListener(
                "change",
                function() {

                    renderContainers();

                    updateContainerKPIs();

                    renderWarehouseSummary();
                }
            );
        }
    );
}


// =====================================================
// NAVIGATION
// =====================================================

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(
            "[data-page]"
        );


    navItems.forEach(
        function(item) {

            item.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();


                    const targetId =
                        item.dataset.page;


                    if (!targetId) {
                        return;
                    }


                    document
                        .querySelectorAll(
                            ".page"
                        )
                        .forEach(
                            function(page) {

                                page.classList.remove(
                                    "active"
                                );
                            }
                        );


                    const target =
                        getElement(targetId);


                    if (target) {

                        target.classList.add(
                            "active"
                        );
                    }


                    navItems.forEach(
                        function(nav) {

                            nav.classList.remove(
                                "active"
                            );
                        }
                    );


                    item.classList.add(
                        "active"
                    );


                    window.scrollTo(
                        {
                            top: 0,
                            behavior: "smooth"
                        }
                    );
                }
            );
        }
    );
}


// =====================================================
// REFRESH ALL DATA
// =====================================================

async function refreshAllData() {

    await Promise.all([
        loadCargo(),
        loadModels(),
        loadContainers()
    ]);


    /*
     * إعادة تحديث Dashboard بعد تحميل
     * جميع مصادر البيانات
     */

    updateCargoDashboard();

    updateShipmentDashboard();

    updateContainerKPIs();

    renderWarehouseSummary();
}


// =====================================================
// CURRENT TRANSIT ALIAS
// =====================================================

function getCurrentTransit(item) {

    let result = "";

    if (item.transit1) {
        result = item.transit1;
    }

    if (item.transit2) {
        result = item.transit2;
    }

    if (item.transit3) {
        result = item.transit3;
    }

    if (item.transit4) {
        result = item.transit4;
    }

    if (item.transit5) {
        result = item.transit5;
    }

    return result;
}


// =====================================================
// SORTING
// =====================================================

let cargoQtyAscending = false;

let cargoFactoryAscending = true;

let shipmentEntryAscending = true;

let shipmentQtyAscending = true;

let shipmentEtaAscending = true;

let containerEntryAscending = true;


function sortCargoByQty() {

    cargoQtyAscending =
        !cargoQtyAscending;


    cargoOrders.sort(
        function(a, b) {

            const result =
                number(a.qty) -
                number(b.qty);

            return cargoQtyAscending
                ? result
                : -result;
        }
    );


    renderCargo();
}


function sortCargoByFactory() {

    cargoFactoryAscending =
        !cargoFactoryAscending;


    cargoOrders.sort(
        function(a, b) {

            const result =
                text(a.factory)
                    .localeCompare(
                        text(b.factory),
                        "ar",
                        {
                            numeric: true
                        }
                    );

            return cargoFactoryAscending
                ? result
                : -result;
        }
    );


    renderCargo();
}


function sortShipmentsByEntry() {

    shipmentEntryAscending =
        !shipmentEntryAscending;


    shipments.sort(
        function(a, b) {

            const result =
                text(a.entry)
                    .localeCompare(
                        text(b.entry),
                        undefined,
                        {
                            numeric: true
                        }
                    );

            return shipmentEntryAscending
                ? result
                : -result;
        }
    );


    renderShipments();
}


function sortShipmentsByQty() {

    shipmentQtyAscending =
        !shipmentQtyAscending;


    shipments.sort(
        function(a, b) {

            const result =
                number(a.qty) -
                number(b.qty);

            return shipmentQtyAscending
                ? result
                : -result;
        }
    );


    renderShipments();
}


function sortShipmentsByETA() {

    shipmentEtaAscending =
        !shipmentEtaAscending;


    shipments.sort(
        function(a, b) {

            const dateA =
                parseDate(a.eta);

            const dateB =
                parseDate(b.eta);


            if (!dateA && !dateB) {
                return 0;
            }


            if (!dateA) {
                return 1;
            }


            if (!dateB) {
                return -1;
            }


            const result =
                dateA - dateB;


            return shipmentEtaAscending
                ? result
                : -result;
        }
    );


    renderShipments();
}


function sortContainersByEntry() {

    containerEntryAscending =
        !containerEntryAscending;


    uniqueContainers.sort(
        function(a, b) {

            const result =
                text(a.entry)
                    .localeCompare(
                        text(b.entry),
                        undefined,
                        {
                            numeric: true
                        }
                    );

            return containerEntryAscending
                ? result
                : -result;
        }
    );


    renderContainers();
}


// =====================================================
// TABLE HEADER SORTING
// =====================================================

document.addEventListener(
    "click",
    function(event) {

        const target =
            event.target.closest(
                "[data-sort]"
            );


        if (!target) {
            return;
        }


        const sort =
            target.dataset.sort;


        switch(sort) {

            case "cargoQty":

                sortCargoByQty();

                break;


            case "cargoFactory":

                sortCargoByFactory();

                break;


            case "shipmentEntry":

                sortShipmentsByEntry();

                break;


            case "shipmentQty":

                sortShipmentsByQty();

                break;


            case "shipmentEta":

                sortShipmentsByETA();

                break;


            case "containerEntry":

                sortContainersByEntry();

                break;
        }
    }
);


// =====================================================
// RESET FILTERS
// =====================================================

function resetCargoFilters() {

    const ids = [

        "cargoSearchInput",
        "cargoDepartmentFilter",
        "cargoFactoryFilter",
        "cargoStatusFilter",
        "cargoLoadingFilter",
        "cargoPolFilter",
        "cargoPodFilter"

    ];


    ids.forEach(
        function(id) {

            const element =
                getElement(id);

            if (element) {

                element.value = "";
            }
        }
    );


    renderCargo();

    updateCargoDashboard();
}


function resetShipmentFilters() {

    const ids = [

        "shipmentsSearchInput",
        "shipmentsDepartmentFilter",
        "shipmentsFactoryFilter",
        "shipmentsPolFilter",
        "shipmentsPodFilter"

    ];


    ids.forEach(
        function(id) {

            const element =
                getElement(id);

            if (element) {

                element.value = "";
            }
        }
    );


    renderShipments();

    updateShipmentDashboard();
}


function resetContainerFilters() {

    const ids = [

        "containersSearchInput",
        "containersDepartmentFilter",
        "containersTransitFilter",
        "containersWarehouseFilter",
        "containersStatusFilter"

    ];


    ids.forEach(
        function(id) {

            const element =
                getElement(id);

            if (element) {

                element.value = "";
            }
        }
    );


    renderContainers();

    updateContainerKPIs();

    renderWarehouseSummary();
}


// =====================================================
// GLOBAL FUNCTIONS
// =====================================================

window.refreshAllData =
    refreshAllData;

window.resetCargoFilters =
    resetCargoFilters;

window.resetShipmentFilters =
    resetShipmentFilters;

window.resetContainerFilters =
    resetContainerFilters;

window.sortCargoByQty =
    sortCargoByQty;

window.sortCargoByFactory =
    sortCargoByFactory;

window.sortShipmentsByEntry =
    sortShipmentsByEntry;

window.sortShipmentsByQty =
    sortShipmentsByQty;

window.sortShipmentsByETA =
    sortShipmentsByETA;

window.sortContainersByEntry =
    sortContainersByEntry;


// =====================================================
// START APPLICATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "LOGISTICS CONTROL TOWER STARTED"
        );

        initializeNavigation();

        attachFilterEvents();

        refreshAllData();
    }
);
