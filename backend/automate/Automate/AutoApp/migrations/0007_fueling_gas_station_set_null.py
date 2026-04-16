from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("AutoApp", "0006_fueling_fuel_type_optional"),
    ]

    operations = [
        migrations.AlterField(
            model_name="fueling",
            name="gas_station",
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, to="AutoApp.gasstation"),
        ),
    ]

