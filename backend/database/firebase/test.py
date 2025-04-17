from plant_service import get_plants_needing_water, update_plant_last_watered

def main():
    #CJYDOOtxeShTEcIUQepJIt5sQa02  uid
    docs = get_plants_needing_water("CJYDOOtxeShTEcIUQepJIt5sQa02")
    for doc in docs:
        print(f'{doc.id} => {doc.to_dict()}')

    update_plant_last_watered("CJYDOOtxeShTEcIUQepJIt5sQa02", "Howie")


if __name__ == "__main__":
    main()